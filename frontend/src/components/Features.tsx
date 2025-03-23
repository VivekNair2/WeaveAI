import { motion } from 'framer-motion';
import { Bot, Cpu, Network, Shield } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Advanced AI Agents",
      description: "Leverage state-of-the-art AI models to automate complex workflows and decision-making processes."
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Seamless Integration",
      description: "Connect with your existing tools and platforms through our extensive API ecosystem."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enterprise Security",
      description: "Bank-grade encryption and compliance measures to keep your data safe and secure."
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Scalable Infrastructure",
      description: "Built to handle millions of operations with consistent performance and reliability."
    }
  ];

  return (
    <section className="relative py-24 bg-timberwolf">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-bistre mb-4">Powerful Features</h2>
          <p className="text-byzantium text-xl">Everything you need to build sophisticated AI workflows</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <div className="text-byzantium mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-bistre mb-2">{feature.title}</h3>
              <p className="text-byzantium">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}