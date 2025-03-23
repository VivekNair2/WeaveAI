import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="relative py-24 bg-bistre">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Workflow?</h2>
          <p className="text-timberwolf text-xl mb-8">
            Join leading companies using weave ai to build the future of work
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-aureolin text-bistre px-8 py-3 rounded-full text-lg font-semibold inline-flex items-center gap-2 hover:bg-opacity-90 transition-all"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}