import { motion } from 'framer-motion';

export function UseCases() {
  const cases = [
    {
      image: "https://assertiveindustries.com/wp-content/uploads/2021/07/Oracle-E-Business-Background.jpg",
      title: "Enterprise Solutions",
      description: "Automate complex business processes and decision-making workflows."
    },
    {
      image: "https://woxsen.edu.in/blog/wp-content/uploads/2021/02/financial-services.jpg",
      title: "Financial Services",
      description: "Streamline document processing and regulatory compliance checks."
    },
    {
      image: "https://www.astronhealthcare.com/blog/wp-content/uploads/2021/04/H14-P-De-Raeve-3003-atl-image-3-696x392-1.jpg",
      title: "Healthcare",
      description: "Enhance patient care with automated data analysis and reporting."
    }
  ];

  return (
    <section className="relative py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-bistre mb-4">Use Cases</h2>
          <p className="text-byzantium text-xl">See how weave ai transforms industries</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="rounded-xl overflow-hidden shadow-lg"
            >
              <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
              <div className="p-6 bg-white">
                <h3 className="text-xl font-semibold text-bistre mb-2">{item.title}</h3>
                <p className="text-byzantium">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}