from typing import Dict, Iterator, Optional
from textwrap import dedent
from agno.workflow import RunEvent, RunResponse, Workflow
from pydantic import BaseModel, Field
from agent import CSVAgent, EmailAgent, TextAgent
from agno.storage.sqlite import SqliteStorage
from agno.utils.log import logger
from agno.utils.pprint import pprint_run_response
import time
import os
from fastapi import UploadFile

class CustomerData(BaseModel):
    name: str = Field(..., description="Customer's name")
    email: str = Field(..., description="Customer's email address")
    description: str = Field(..., description="Personal description of the customer")

# ...existing imports...



class MarketingEmailWorkflow(Workflow):
    """Workflow for sending personalized marketing emails to customers based on CSV data."""

    description: str = dedent("""
    An intelligent marketing email workflow that processes customer data from a CSV file
    and sends personalized marketing emails. The workflow combines data processing with
    personalized content generation to create targeted marketing campaigns.
    """)

    def __init__(
        self,
        session_id: str,
        file: UploadFile,
        sender_email: str,
        sender_name: str,
        sender_passkey: str,
        model: str = "gemini",
        *args,
        **kwargs
    ):
        super().__init__(session_id=session_id, *args, **kwargs)
        self.file = file
        self.sender_email = sender_email
        self.sender_name = sender_name
        self.sender_passkey = sender_passkey
        self.model = model

        # Read the file content once
        try:
            self.file_content = self.file.file.read().decode("utf-8")
            # Reset file pointer after reading
            self.file.file.seek(0)
            print(f"Successfully read file content, length: {len(self.file_content)}")
            print(f"File content preview: {self.file_content[:100]}...")
        except Exception as e:
            print(f"ERROR reading file content: {str(e)}")
            self.file_content = None
        
        # Initialize CSV Agent with the file content
        self.csv_agent = CSVAgent(model=self.model, file=self.file)

    def run(
        self,
        company_name: str,
        product_description: str,
        use_cached_results: bool = True,
        max_retries: int = 3,
        retry_delay: int = 5
    ) -> Iterator[RunResponse]:
        print(f"=== Starting marketing email workflow for {company_name} ===")
        logger.info(f"Starting marketing email campaign for {company_name}")

        # Input validation
        print(f"Validating inputs - company_name: {company_name}, product_description length: {len(product_description)}")
        if not company_name or not product_description:
            print("ERROR: Missing required inputs")
            raise ValueError("Company name and product description are required")

        # Check cache for previously sent emails
        if use_cached_results:
            print("Checking cache for previous results")
            cached_results = self.get_cached_results(company_name)
            if cached_results:
                print(f"Using cached results found for {company_name}")
                yield RunResponse(
                    content=cached_results,
                    event=RunEvent.workflow_completed
                )
                return
            print("No cached results found")

        try:
            # Get customer data from CSV with proper error handling
            customer_query = "SELECT * FROM sample_marketing"
            print(f"Executing CSV query: {customer_query}")
            retry_count = 0
            csv_response = None
            
            while retry_count < max_retries:
                try:
                    print(f"CSV Agent attempt {retry_count + 1}")
                    # Debug the CSV agent instance
                    print(f"CSV Agent model: {self.model}")
                    print(f"CSV Agent file name: {self.file.filename}")
                    
                    # Reset the file pointer before each attempt
                    self.file.file.seek(0)
                    print("File pointer reset to beginning")
                    
                    # If the CSV agent can't find the file, we'll use our own function to parse the CSV content directly
                    if retry_count > 0 or "was not found" in csv_response if csv_response else False:
                        print("CSV Agent couldn't find the file. Using direct content parsing")
                        # Format the file content as a markdown table and skip the CSV agent
                        csv_response = self.format_csv_as_markdown_table()
                        if csv_response and len(csv_response) > 0:
                            print("Successfully created markdown table from file content")
                            print(f"Table preview: {csv_response[:150]}...")
                            break
                        else:
                            print("ERROR: Failed to format CSV content as table")
                            raise Exception("Failed to format CSV content as table")
                    else:
                        # Try the regular CSV agent first
                        csv_response = self.csv_agent.run_agent(customer_query)
                        print(f"CSV Agent response received, length: {len(csv_response) if csv_response else 0}")
                        if csv_response and len(csv_response.strip()) > 0 and "was not found" not in csv_response:
                            print("CSV Agent returned valid response")
                            break
                        
                    retry_count += 1
                    print(f"Retry {retry_count}/{max_retries}")
                    if retry_count < max_retries:
                        print(f"Waiting {retry_delay} seconds before retry...")
                        time.sleep(retry_delay)
                    else:
                        print("ERROR: Maximum retries reached")
                        # Force use of our direct parsing on last attempt
                        csv_response = self.format_csv_as_markdown_table()
                        if not csv_response or len(csv_response) == 0:
                            raise Exception("Failed to process CSV data after multiple attempts")
                        else:
                            print("Using direct CSV parsing as fallback")
                            break
                            
                except Exception as e:
                    retry_count += 1
                    print(f"CSV Agent attempt {retry_count} failed: {str(e)}")
                    print(f"Exception type: {type(e).__name__}")
                    logger.warning(f"Attempt {retry_count} failed: {str(e)}")
                    
                    if retry_count < max_retries:
                        print(f"Waiting {retry_delay} seconds before retry...")
                        time.sleep(retry_delay)
                    else:
                        # Try direct parsing as a last resort
                        print("Attempting direct CSV parsing as last resort")
                        try:
                            csv_response = self.format_csv_as_markdown_table()
                            if csv_response and len(csv_response) > 0:
                                print("Successfully created markdown table as fallback")
                                break
                            else:
                                print("ERROR: Even direct parsing failed")
                        except Exception as direct_e:
                            print(f"ERROR: Direct parsing also failed: {str(direct_e)}")
                        
                        print(f"ERROR: Failed after {max_retries} attempts")
                        raise Exception(f"Failed to fetch customer data after {max_retries} attempts: {str(e)}")
        
            if not csv_response:
                print("ERROR: No customer data received from CSV")
                raise Exception("No customer data received from CSV")
            
            print(f"CSV Response preview: {csv_response[:200]}...")
                
            # Process each customer and send personalized email with delay between sends
            print("Parsing CSV response to extract customer data")
            results = []
            customer_count = 0
            
            # Debug the parse_csv_response method
            print("=== Starting CSV parsing ===")
            parsed_customers = list(self.parse_csv_response(csv_response))
            print(f"Parsed {len(parsed_customers)} customers from CSV data")
            
            if not parsed_customers:
                print("WARNING: No valid customers found in CSV data")
                yield RunResponse(
                    content=f"No valid customers found in CSV data",
                    event=RunEvent.workflow_completed
                )
                return
                
            for customer_data in parsed_customers:
                customer_count += 1
                print(f"Processing customer {customer_count}: {customer_data.name} <{customer_data.email}>")
                logger.debug(f"Processing customer: {customer_data.email}")

                # Create email content based on customer description
                print(f"Generating email content for {customer_data.name}")
                try:
                    email_content = self.generate_email_content(
                        customer_data,
                        company_name,
                        product_description
                    )
                    print(f"Email content generated, length: {len(email_content)}")
                    print(f"Email preview: {email_content[:100]}...")
                except Exception as e:
                    print(f"ERROR generating email content: {str(e)}")
                    logger.error(f"Error generating email content: {str(e)}")
                    continue

                # Initialize EmailAgent for this customer
                print(f"Initializing EmailAgent for {customer_data.email}")
                print(f"Sender details - Email: {self.sender_email}, Name: {self.sender_name}")
                try:
                    email_agent = EmailAgent(
                        model=self.model,
                        receiver_email=customer_data.email,
                        sender_email=self.sender_email,
                        sender_name=self.sender_name,
                        sender_passkey=self.sender_passkey
                    )
                    print("EmailAgent initialized successfully")
                except Exception as e:
                    print(f"ERROR initializing EmailAgent: {str(e)}")
                    logger.error(f"Error initializing EmailAgent: {str(e)}")
                    results.append({
                        "customer": customer_data.model_dump(),
                        "email_status": "failed",
                        "error": f"Failed to initialize EmailAgent: {str(e)}"
                    })
                    continue

                retry_count = 0
                while retry_count < max_retries:
                    try:
                        # Verify the EmailAgent's receiver is correct before sending
                        print(f"About to send email using EmailAgent, verifying receiver: {email_agent.receiver_email}")
                        if email_agent.receiver_email != customer_data.email:
                            print(f"WARNING: Email address mismatch! Recreating EmailAgent with correct address")
                            # Recreate the agent with the correct receiver
                            email_agent = EmailAgent(
                                model=self.model,
                                receiver_email=customer_data.email,
                                sender_email=self.sender_email,
                                sender_name=self.sender_name,
                                sender_passkey=self.sender_passkey
                            )
                            
                        print(f"Sending email to {customer_data.email}, attempt {retry_count+1}")
                        logger.debug(f"Sending email to {customer_data.email}, attempt {retry_count+1}")
                        # Send personalized email with exponential backoff
                        email_response = email_agent.run_agent(email_content)
                        print(f"Email sent successfully to {customer_data.email}")
                        print(f"Response: {email_response}")
                        logger.debug(f"Email sent to {customer_data.email} with response: {email_response}")
                        results.append({
                            "customer": customer_data.model_dump(),
                            "email_status": "success",
                            "response": email_response
                        })
                        # Add delay between sends with exponential backoff
                        delay_time = retry_delay * (2 ** retry_count)
                        print(f"Waiting {delay_time} seconds before next email...")
                        time.sleep(delay_time)
                        break
                    except Exception as e:
                        retry_count += 1
                        print(f"ERROR: Email sending attempt {retry_count} failed for {customer_data.email}: {str(e)}")
                        print(f"Exception type: {type(e).__name__}")
                        logger.warning(f"Attempt {retry_count} failed for {customer_data.email}: {str(e)}")
                        if retry_count < max_retries:
                            delay_time = retry_delay * (2 ** retry_count)
                            print(f"Waiting {delay_time} seconds before retry...")
                            time.sleep(delay_time)
                        else:
                            print(f"ERROR: Failed to send email to {customer_data.email} after {max_retries} attempts")
                            logger.error(f"Failed to send email to {customer_data.email} after {max_retries} attempts")
                            results.append({
                                "customer": customer_data.model_dump(),
                                "email_status": "failed",
                                "error": f"Failed after {max_retries} attempts: {str(e)}"
                            })

            # Cache the results
            print(f"Caching results for {company_name}, {len(results)} emails processed")
            self.add_results_to_cache(company_name, results)

            # Return final response
            success_count = sum(1 for r in results if r.get("email_status") == "success")
            print(f"=== Workflow completed: {success_count}/{len(results)} emails sent successfully ===")
            yield RunResponse(
                content=f"Successfully sent {success_count} of {len(results)} personalized marketing emails",
                event=RunEvent.workflow_completed
            )

        except Exception as e:
            print(f"ERROR: Workflow exception: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            logger.error(f"Error in marketing workflow: {str(e)}")
            yield RunResponse(
                content=f"Error: {str(e)}",
                event=RunEvent.workflow_completed
            )

    def parse_csv_response(self, csv_response: str) -> Iterator[CustomerData]:
        """Parse the CSV agent response and yield CustomerData objects."""
        try:
            print("=== Starting CSV response parsing ===")
            print(f"CSV response length: {len(csv_response)}")
            print(f"CSV response first 100 chars: {csv_response[:100]}")
            logger.debug("Parsing CSV response: %s", csv_response)
            # Skip empty responses
            if not csv_response or not csv_response.strip():
                print("WARNING: Empty CSV response received")
                logger.warning("Empty CSV response received")
                return

            # Split the response into lines and clean up
            lines = [line.strip() for line in csv_response.strip().split('\n') if line.strip()]
            print(f"Split CSV response into {len(lines)} lines")
            print(f"First 3 lines: {lines[:3]}")
            logger.debug("CSV response split into %d lines", len(lines))
            if not lines:
                print("WARNING: No valid data found in CSV response after splitting")
                logger.warning("No valid data found in CSV response")
                return

            # Find the actual data rows (skip markdown formatting)
            data_rows = []
            for i, line in enumerate(lines):
                print(f"Analyzing line {i}: {line}")
                # Skip markdown table formatting and empty lines
                if line.startswith('|') and not line.replace('|', '').replace('-', '').strip() == '':
                    cleaned_line = line.strip('|').strip()
                    if cleaned_line and not cleaned_line.startswith('-'):
                        data_rows.append(cleaned_line)
                        print(f"Added data row: {cleaned_line}")
                    else:
                        print(f"Skipping line {i} (separator or empty): {line}")
                else:
                    print(f"Skipping non-table line {i}: {line}")
                        
            print(f"Extracted {len(data_rows)} data rows after cleaning")
            if data_rows:
                print(f"Data rows preview: {data_rows[:2]}")
            logger.debug("Extracted %d data rows", len(data_rows))  # Fixed missing closing parenthesis here

            if len(data_rows) <= 1:
                print("WARNING: No data rows found (or only header row)")
                return

            # Process each data row (skipping header)
            valid_customer_count = 0
            for i, row_str in enumerate(data_rows[1:], 1):
                print(f"Processing row {i}: {row_str}")
                logger.debug("Processing row: %s", row_str)
                try:
                    cells = [cell.strip() for cell in row_str.split('|')]
                    print(f"Split into {len(cells)} cells: {cells}")
                    if len(cells) >= 3:
                        name = cells[0]
                        email = cells[1]
                        description = cells[2]
                        print(f"Extracted - Name: '{name}', Email: '{email}', Description preview: '{description[:30]}...'")
                        if '@' in email:
                            valid_customer_count += 1
                            print(f"Creating CustomerData object for {name}")
                            yield CustomerData(
                                name=name,
                                email=email,
                                description=description
                            )
                        else:
                            print(f"WARNING: Invalid email format '{email}' in row {i}")
                            logger.warning("Invalid email format in row: %s", row_str)
                    else:
                        print(f"WARNING: Skipping row {i}, insufficient cells (found {len(cells)}, need at least 3)")
                        logger.warning("Skipping invalid row: %s", row_str)
                except Exception as e:
                    print(f"ERROR: Failed to process row {i}: {str(e)}")
                    print(f"Exception type: {type(e).__name__}")
                    logger.error("Error processing row '%s': %s", row_str, str(e))
                    continue
            print(f"=== CSV parsing complete: {valid_customer_count} valid customers found ===")
        except Exception as e:
            print(f"ERROR: Failed to parse CSV response: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            logger.error("Error parsing CSV response: %s", str(e))
            raise

    def generate_email_content(self, customer: CustomerData, company_name: str, product_description: str) -> str:
        """Generate personalized email content using TextAgent based on customer data."""
        # Initialize TextAgent for content generation
        text_agent = TextAgent(
            model=self.model,
            instructions="You are an expert marketing copywriter. Generate personalized email content that is engaging, professional, and tailored to the recipient's profile."
        )
        
        # Prepare the prompt for content generation
        prompt = f"""Generate a marketing email with the following details:
        - Recipient's Name: {customer.name}
        - Recipient's Professional Background: {customer.description}
        - Company Name: {company_name}
        - Product/Service Description: {product_description}
        -Sender's Name: {self.sender_name}
        
        The email should:
        1. Have an engaging subject line
        2. Be personalized based on the recipient's background
        3. Highlight how our solutions address their specific needs
        4. Include a clear call to action
        5. Maintain a professional yet friendly tone
        
        Format the email with proper structure including subject line, greeting, body, and signature."""
        
        # Generate personalized content
        email_content = text_agent.run_agent(prompt)
        return email_content

    def get_cached_results(self, company_name: str) -> Optional[str]:
        """Retrieve cached results for the company's campaign."""
        return self.session_state.get("email_campaigns", {}).get(company_name)

    def add_results_to_cache(self, company_name: str, results: list):
        """Cache the results of the email campaign."""
        self.session_state.setdefault("email_campaigns", {})
        self.session_state["email_campaigns"][company_name] = results

    def format_csv_as_markdown_table(self) -> str:
        """Format the CSV content as a markdown table for parsing."""
        try:
            print("Formatting CSV content as markdown table")
            if not self.file_content:
                print("ERROR: No file content available")
                return ""
                
            # Print raw content for debugging
            print(f"Raw content first 100 chars: {self.file_content[:100].replace(chr(10), '\\n').replace(chr(13), '\\r')}")
                
            # Split the content into lines
            lines = [line.strip() for line in self.file_content.strip().split('\n') if line.strip()]
            if not lines:
                print("ERROR: No lines found in file content")
                return ""
                
            print(f"Found {len(lines)} lines in CSV")
            print(f"First line: {lines[0]}")
            
            # Get headers from first line
            headers = [h.strip() for h in lines[0].split(',')]
            print(f"Headers: {headers}")
            
            # Build the markdown table
            table = "| " + " | ".join(headers) + " |\n"
            table += "| " + " | ".join(["---"] * len(headers)) + " |\n"
            
            # Add data rows
            for i, line in enumerate(lines[1:], 1):
                print(f"Processing line {i}: {line}")
                values = [val.strip() for val in line.split(',')]
                # Ensure we have the right number of values
                while len(values) < len(headers):
                    values.append("")
                table += "| " + " | ".join(values) + " |\n"
                print(f"Added row {i}: | {' | '.join(values)} |")
                
            print(f"Created markdown table with {len(lines)-1} data rows")
            print(f"Table preview: {table.strip()[:200]}...")
            return table
        except Exception as e:
            print(f"ERROR formatting CSV as table: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            print(f"File content sample: {self.file_content[:100] if self.file_content else 'None'}")
            return ""