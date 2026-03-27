import { Mail, Phone, MapPin } from 'lucide-react';

export function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl mb-8">Sobre AHB Solutions</h1>

        <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
          <h2 className="text-2xl mb-4">Nuestra Historia</h2>
          <p className="text-gray-700 mb-4">
            AHB Solutions es una empresa especializada en la fabricación y comercialización de productos de metacrilato de alta calidad. Con más de 15 años de experiencia en el sector, nos hemos consolidado como referente en el mercado español.
          </p>
          <p className="text-gray-700 mb-4">
            Nuestro compromiso es ofrecer productos innovadores, duraderos y con un diseño excepcional que se adapten a las necesidades tanto de particulares como de empresas.
          </p>
          <p className="text-gray-700">
            Trabajamos con los mejores materiales y contamos con un equipo de profesionales altamente cualificados que garantizan la excelencia en cada proyecto.
          </p>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
          <h2 className="text-2xl mb-6">¿Por qué elegir metacrilato?</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Resistencia:</strong> Material duradero y resistente a impactos</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Transparencia:</strong> Claridad óptica superior al vidrio</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Versatilidad:</strong> Fácil de moldear y personalizar</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Ligereza:</strong> Más ligero que el vidrio, fácil de instalar</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Durabilidad:</strong> Resistente a la intemperie y rayos UV</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl mb-6">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xl mb-2">Calidad</h3>
              <p className="text-gray-700">
                Utilizamos solo los mejores materiales para garantizar productos de primera calidad.
              </p>
            </div>
            <div>
              <h3 className="text-xl mb-2">Innovación</h3>
              <p className="text-gray-700">
                Constantemente desarrollamos nuevos diseños y soluciones para nuestros clientes.
              </p>
            </div>
            <div>
              <h3 className="text-xl mb-2">Servicio</h3>
              <p className="text-gray-700">
                Atención personalizada y compromiso con la satisfacción del cliente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl mb-8">Contacto</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl mb-6">Información de Contacto</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div>info@ahbsolutions.com</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-600">Teléfono</div>
                  <div>+34 900 123 456</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-600">Dirección</div>
                  <div>Calle Ejemplo, 123<br />28001 Madrid, España</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">Horario de Atención</h3>
              <p className="text-gray-700">
                Lunes a Viernes: 9:00 - 18:00<br />
                Sábados: 10:00 - 14:00<br />
                Domingos: Cerrado
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl mb-6">Envíanos un Mensaje</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Mensaje *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
