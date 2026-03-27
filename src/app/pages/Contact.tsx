import React from 'react';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';

export function Contact() {
  const [sent, setSent] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="bg-white">
      <div className="bg-slate-900 py-20 text-white">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight">Contacta con nosotros</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            ¿Tienes un proyecto en mente? Nuestro equipo de expertos en metacrilato está listo para ayudarte.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Contact Info */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Información de Contacto</h2>
            <p className="text-slate-600 mb-10 leading-relaxed text-lg">
              Estamos a tu disposición para resolver cualquier duda sobre nuestros productos, procesos de fabricación a medida o solicitar presupuestos.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="bg-blue-100 p-4 rounded-xl text-blue-700">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Teléfono</h3>
                  <p className="text-slate-600">Lunes a Viernes: 9:00 - 18:00</p>
                  <p className="text-xl font-bold text-blue-700 mt-2">+34 900 123 456</p>
                </div>
              </div>
              
              <div className="flex items-start gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="bg-blue-100 p-4 rounded-xl text-blue-700">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Email</h3>
                  <p className="text-slate-600 mb-2">Para consultas generales y presupuestos:</p>
                  <a href="mailto:info@ahbsolutions.com" className="text-lg font-bold text-blue-700 hover:underline">info@ahbsolutions.com</a>
                </div>
              </div>
              
              <div className="flex items-start gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="bg-blue-100 p-4 rounded-xl text-blue-700">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Nuestra Fábrica</h3>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    Calle Industria, 42<br />
                    Polígono Industrial Sur<br />
                    28015 Madrid, España
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6 bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-200">
                <div className="bg-blue-600 p-4 rounded-xl text-white">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Servicio 24/7</h3>
                  <p className="text-slate-700 font-medium">Tienda Online Siempre Abierta</p>
                  <p className="text-slate-600 mt-1">Sistema automatizado de recepción de llaves disponible las 24 horas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Envíanos un mensaje</h2>
            
            {sent ? (
              <div className="bg-emerald-50 text-emerald-800 p-8 rounded-2xl text-center border border-emerald-100">
                <h3 className="text-xl font-bold mb-2">¡Mensaje enviado!</h3>
                <p>Nos pondremos en contacto contigo lo antes posible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nombre</label>
                    <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <input required type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Asunto</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                    <option>Información general</option>
                    <option>Presupuesto a medida</option>
                    <option>Soporte técnico</option>
                    <option>Otros</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Mensaje</label>
                  <textarea required rows={5} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-all focus:ring-4 focus:ring-blue-500/50 shadow-lg shadow-blue-200"
                >
                  <Send size={20} /> Enviar Mensaje
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}