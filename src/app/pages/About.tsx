import { MapPin, Mail, Phone, Clock } from "lucide-react";

export function About() {
  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Sobre Nosotros</h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            AHB Solutions: Expertos en transformar el metacrilato en soluciones prácticas y elegantes para tu negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestra Historia</h2>
            <div className="prose prose-blue text-gray-600 space-y-4">
              <p>
                En AHB Solutions llevamos más de una década especializados única y exclusivamente en el trabajo con metacrilato. Nuestra pasión por este material versátil y duradero nos ha llevado a perfeccionar cada técnica de corte, plegado y pulido.
              </p>
              <p>
                Entendemos que la presentación lo es todo en el mundo de los negocios. Por ello, nuestro catálogo está meticulosamente diseñado para cubrir las necesidades de exposición, organización y comunicación visual.
              </p>
              <p>
                Desde robustas mamparas protectoras hasta delicados expositores de joyería, tratamos cada pieza con el máximo rigor para asegurar un acabado "efecto cristal" impecable, sin renunciar a la resistencia que caracteriza al metacrilato de alta calidad.
              </p>
            </div>
            
            <div className="mt-10 bg-blue-50 rounded-xl p-8 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Información de Contacto</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <MapPin className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Ctra. de Málaga, 160<br/>La Chana<br/>18015 Granada, España</span>
                </li>
                <li className="flex items-center">
                  <Phone className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">+34 958 289 127</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">contacto@ahbsolutions.es</span>
                </li>
                <li className="flex items-center">
                  <Clock className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                  <div>
                    <span className="text-gray-700 font-semibold">Servicio 24/7</span>
                    <br />
                    <span className="text-sm text-gray-600">Tienda online y recepción de llaves automatizada disponibles 24h</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col h-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestra Ubicación</h2>
            <div className="bg-gray-200 rounded-xl overflow-hidden shadow-inner h-[500px] relative w-full flex-grow border border-gray-300">
              <iframe
                title="Mapa de ubicación de AHB Solutions
                "
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3178.359305976565!2d-3.643910223311444!3d37.19169437213824!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd71fc49c36aaaab%3A0x6a101f67d5235ad2!2sAHB%20Hispania%2C%20SL!5e0!3m2!1ses!2ses!4v1773996538302!5m2!1ses!2ses"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}