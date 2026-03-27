-- ============================================
-- SCHEMA SQL PARA SUPABASE - AHB SOLUTIONS
-- E-commerce de productos de metacrilato
-- ============================================

-- ============================================
-- EXTENSIONES
-- ============================================
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLAS
-- ============================================

-- Tabla de usuarios (extiende auth.users de Supabase)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre_completo TEXT,
    telefono TEXT,
    empresa TEXT,
    rol TEXT DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    ultima_conexion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de direcciones de envío
CREATE TABLE public.direcciones_envio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    direccion TEXT NOT NULL,
    codigo_postal TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    provincia TEXT NOT NULL,
    pais TEXT DEFAULT 'España',
    telefono TEXT NOT NULL,
    es_predeterminada BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de categorías de productos
CREATE TABLE public.categorias_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_categoria TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    slug TEXT UNIQUE NOT NULL,
    imagen_url TEXT,
    activa BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE public.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_producto TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria_id UUID NOT NULL REFERENCES public.categorias_productos(id) ON DELETE RESTRICT,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    precio_original DECIMAL(10, 2), -- Para ofertas
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INTEGER DEFAULT 5,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    slug TEXT UNIQUE NOT NULL,
    imagen_principal TEXT,
    peso DECIMAL(10, 2), -- en kg
    dimensiones JSONB, -- {ancho: x, alto: y, profundo: z}
    personalizable BOOLEAN DEFAULT false,
    etiquetas TEXT[], -- array de tags
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de imágenes de productos (múltiples imágenes por producto)
CREATE TABLE public.imagenes_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    orden INTEGER DEFAULT 0,
    es_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ofertas/descuentos
CREATE TABLE public.ofertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    porcentaje_descuento INTEGER NOT NULL CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    activa BOOLEAN DEFAULT true,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_fechas CHECK (fecha_fin > fecha_inicio)
);

-- Tabla de pedidos
CREATE TABLE public.pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_pedido TEXT UNIQUE NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    direccion_envio_id UUID REFERENCES public.direcciones_envio(id),
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado')),
    subtotal DECIMAL(10, 2) NOT NULL,
    impuestos DECIMAL(10, 2) DEFAULT 0,
    gastos_envio DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    metodo_pago TEXT,
    notas TEXT,
    fecha_pedido TIMESTAMPTZ DEFAULT NOW(),
    fecha_envio TIMESTAMPTZ,
    fecha_entrega TIMESTAMPTZ,
    numero_seguimiento TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de líneas de pedido (productos dentro de un pedido)
CREATE TABLE public.lineas_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    precio_total DECIMAL(10, 2) NOT NULL,
    personalizacion JSONB, -- datos de personalización si aplica
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de carrito de compra
CREATE TABLE public.carritos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    sesion_id TEXT, -- Para carritos de usuarios no autenticados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_usuario_o_sesion CHECK (usuario_id IS NOT NULL OR sesion_id IS NOT NULL)
);

-- Tabla de items del carrito
CREATE TABLE public.items_carrito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrito_id UUID NOT NULL REFERENCES public.carritos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    personalizacion JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración del sitio
CREATE TABLE public.configuracion_sitio (
    clave TEXT PRIMARY KEY,
    valor TEXT,
    descripcion TEXT,
    tipo TEXT DEFAULT 'texto' CHECK (tipo IN ('texto', 'numero', 'booleano', 'json')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Índices para mejorar rendimiento de consultas
CREATE INDEX idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX idx_productos_activo ON public.productos(activo);
CREATE INDEX idx_productos_destacado ON public.productos(destacado);
CREATE INDEX idx_productos_slug ON public.productos(slug);
CREATE INDEX idx_imagenes_productos_producto_id ON public.imagenes_productos(producto_id);
CREATE INDEX idx_ofertas_producto_id ON public.ofertas(producto_id);
CREATE INDEX idx_ofertas_activa ON public.ofertas(activa);
CREATE INDEX idx_ofertas_fechas ON public.ofertas(fecha_inicio, fecha_fin);
CREATE INDEX idx_pedidos_usuario ON public.pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON public.pedidos(fecha_pedido);
CREATE INDEX idx_lineas_pedido_pedido_id ON public.lineas_pedido(pedido_id);
CREATE INDEX idx_carritos_usuario ON public.carritos(usuario_id);
CREATE INDEX idx_items_carrito_carrito_id ON public.items_carrito(carrito_id);
CREATE INDEX idx_direcciones_usuario ON public.direcciones_envio(usuario_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Función para crear automáticamente el registro en public.usuarios cuando se registra en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    primer_usuario BOOLEAN;
BEGIN
    -- Verificar si es el primer usuario registrado
    SELECT NOT EXISTS (SELECT 1 FROM public.usuarios LIMIT 1) INTO primer_usuario;
    
    -- Insertar en public.usuarios
    INSERT INTO public.usuarios (id, email, nombre_completo, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.raw_user_meta_data->>'full_name'),
        CASE 
            WHEN primer_usuario THEN 'admin'  -- El primer usuario es admin automáticamente
            ELSE 'cliente'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta cuando se crea un usuario en auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_direcciones_updated_at BEFORE UPDATE ON public.direcciones_envio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias_productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON public.productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ofertas_updated_at BEFORE UPDATE ON public.ofertas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carritos_updated_at BEFORE UPDATE ON public.carritos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_carrito_updated_at BEFORE UPDATE ON public.items_carrito
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de pedido único
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero_pedido = 'AHB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('pedidos_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Secuencia para números de pedido
CREATE SEQUENCE IF NOT EXISTS pedidos_seq START 1;

-- Trigger para generar número de pedido
CREATE TRIGGER generate_numero_pedido BEFORE INSERT ON public.pedidos
    FOR EACH ROW EXECUTE FUNCTION generar_numero_pedido();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direcciones_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imagenes_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineas_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_carrito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sitio ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil"
    ON public.usuarios FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON public.usuarios FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los usuarios"
    ON public.usuarios FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para direcciones de envío
CREATE POLICY "Usuarios pueden ver sus direcciones"
    ON public.direcciones_envio FOR SELECT
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear sus direcciones"
    ON public.direcciones_envio FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus direcciones"
    ON public.direcciones_envio FOR UPDATE
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden eliminar sus direcciones"
    ON public.direcciones_envio FOR DELETE
    USING (auth.uid() = usuario_id);

-- Políticas para categorías (públicas para lectura)
CREATE POLICY "Categorías visibles para todos"
    ON public.categorias_productos FOR SELECT
    USING (activa = true);

CREATE POLICY "Solo admins pueden modificar categorías"
    ON public.categorias_productos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para productos (públicos para lectura)
CREATE POLICY "Productos activos visibles para todos"
    ON public.productos FOR SELECT
    USING (activo = true);

CREATE POLICY "Solo admins pueden modificar productos"
    ON public.productos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para imágenes de productos (públicas)
CREATE POLICY "Imágenes de productos visibles para todos"
    ON public.imagenes_productos FOR SELECT
    USING (true);

CREATE POLICY "Solo admins pueden modificar imágenes"
    ON public.imagenes_productos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para ofertas (públicas)
CREATE POLICY "Ofertas activas visibles para todos"
    ON public.ofertas FOR SELECT
    USING (activa = true);

CREATE POLICY "Solo admins pueden modificar ofertas"
    ON public.ofertas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para pedidos
CREATE POLICY "Usuarios pueden ver sus pedidos"
    ON public.pedidos FOR SELECT
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear pedidos"
    ON public.pedidos FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins pueden ver todos los pedidos"
    ON public.pedidos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden actualizar pedidos"
    ON public.pedidos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para líneas de pedido
CREATE POLICY "Usuarios pueden ver líneas de sus pedidos"
    ON public.lineas_pedido FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pedidos
            WHERE pedidos.id = lineas_pedido.pedido_id
            AND pedidos.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden ver todas las líneas"
    ON public.lineas_pedido FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para carritos
CREATE POLICY "Usuarios pueden ver su carrito"
    ON public.carritos FOR SELECT
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear su carrito"
    ON public.carritos FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar su carrito"
    ON public.carritos FOR UPDATE
    USING (auth.uid() = usuario_id);

-- Políticas para items del carrito
CREATE POLICY "Usuarios pueden ver items de su carrito"
    ON public.items_carrito FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.carritos
            WHERE carritos.id = items_carrito.carrito_id
            AND carritos.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden modificar items de su carrito"
    ON public.items_carrito FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.carritos
            WHERE carritos.id = items_carrito.carrito_id
            AND carritos.usuario_id = auth.uid()
        )
    );

-- Políticas para configuración del sitio
CREATE POLICY "Configuración visible para todos"
    ON public.configuracion_sitio FOR SELECT
    USING (true);

CREATE POLICY "Solo admins pueden modificar configuración"
    ON public.configuracion_sitio FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- ============================================
-- DATOS INICIALES DE EJEMPLO
-- ============================================

-- Insertar categorías del proyecto (las 10 categorías reales)
INSERT INTO categorias_productos (codigo_categoria, nombre, descripcion, slug) VALUES
('CAT-001', 'Atriles', 'Atriles de metacrilato para presentaciones y conferencias', 'atriles'),
('CAT-002', 'Expositores de pie', 'Expositores de pie para catálogos y menús', 'expositores-de-pie'),
('CAT-003', 'Expositores Sobremesa', 'Expositores de sobremesa para información y precios', 'expositores-sobremesa'),
('CAT-004', 'Llaveros personalizables', 'Llaveros de metacrilato personalizables', 'llaveros-personalizables'),
('CAT-005', 'Mamparas', 'Mamparas de protección de metacrilato', 'mamparas'),
('CAT-006', 'Placas personalizables', 'Placas de metacrilato para personalización', 'placas-personalizables'),
('CAT-007', 'Tarjeteros', 'Tarjeteros y porta tarjetas de metacrilato', 'tarjeteros'),
('CAT-008', 'Tripticos', 'Trípticos y expositores de mesa', 'tripticos'),
('CAT-009', 'Urnas', 'Urnas de metacrilato para sorteos y votaciones', 'urnas'),
('CAT-010', 'Vitrinas', 'Vitrinas expositoras de metacrilato', 'vitrinas');

-- Insertar configuración inicial del sitio
INSERT INTO configuracion_sitio (clave, valor, descripcion, tipo) VALUES
('nombre_sitio', 'AHB Solutions', 'Nombre de la tienda', 'texto'),
('email_contacto', 'info@ahbsolutions.es', 'Email de contacto', 'texto'),
('telefono_contacto', '+34 900 000 000', 'Teléfono de contacto', 'texto'),
('iva_porcentaje', '21', 'Porcentaje de IVA aplicado', 'numero'),
('gastos_envio_gratis_desde', '100', 'Compra mínima para envío gratuito', 'numero'),
('gastos_envio_estandar', '5.95', 'Coste de envío estándar', 'numero'),
('servicio_24_7', 'true', 'Servicio disponible 24/7', 'booleano'),
('mensaje_cabecera', 'Envío GRATIS en pedidos superiores a 100€', 'Mensaje en cabecera', 'texto');

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para obtener productos con ofertas activas
CREATE OR REPLACE FUNCTION obtener_productos_con_ofertas()
RETURNS TABLE (
    producto_id UUID,
    nombre TEXT,
    precio_actual DECIMAL,
    precio_original DECIMAL,
    porcentaje_descuento INTEGER,
    fecha_fin_oferta TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.precio,
        p.precio_original,
        o.porcentaje_descuento,
        o.fecha_fin
    FROM public.productos p
    INNER JOIN public.ofertas o ON p.id = o.producto_id
    WHERE o.activa = true
    AND NOW() BETWEEN o.fecha_inicio AND o.fecha_fin
    AND p.activo = true;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener productos destacados
CREATE OR REPLACE FUNCTION obtener_productos_destacados(limite INTEGER DEFAULT 4)
RETURNS TABLE (
    producto_id UUID,
    nombre TEXT,
    descripcion TEXT,
    precio DECIMAL,
    imagen_principal TEXT,
    slug TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen_principal,
        p.slug
    FROM public.productos p
    WHERE p.destacado = true
    AND p.activo = true
    ORDER BY p.created_at DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE public.usuarios IS 'Tabla de usuarios del sistema (extiende auth.users)';
COMMENT ON TABLE public.productos IS 'Catálogo de productos de metacrilato';
COMMENT ON TABLE public.categorias_productos IS 'Categorías de productos del e-commerce';
COMMENT ON TABLE public.ofertas IS 'Ofertas y descuentos aplicados a productos';
COMMENT ON TABLE public.pedidos IS 'Pedidos realizados por los usuarios';
COMMENT ON TABLE public.carritos IS 'Carritos de compra (usuarios autenticados y sesiones)';

-- ============================================
-- GESTIÓN DE ROLES DE ADMINISTRADOR
-- ============================================

/*
CÓMO FUNCIONA LA ASIGNACIÓN DE ADMIN:

1️⃣ AUTOMÁTICO - El primer usuario que se registre será ADMIN automáticamente
   - El trigger 'handle_new_user' detecta si es el primer usuario
   - Le asigna rol = 'admin' al primer registro
   - Todos los demás usuarios serán 'cliente' por defecto

2️⃣ MANUAL - Promover un usuario a admin desde el SQL Editor de Supabase:

   -- Ver todos los usuarios y sus roles:
   SELECT id, email, nombre_completo, rol, fecha_registro 
   FROM public.usuarios 
   ORDER BY fecha_registro;

   -- Promover un usuario a admin por su EMAIL:
   UPDATE public.usuarios 
   SET rol = 'admin' 
   WHERE email = 'tu-email@ejemplo.com';

   -- Promover un usuario a admin por su ID:
   UPDATE public.usuarios 
   SET rol = 'admin' 
   WHERE id = 'uuid-del-usuario-aqui';

   -- Degradar un admin a cliente:
   UPDATE public.usuarios 
   SET rol = 'cliente' 
   WHERE email = 'admin@ejemplo.com';

3️⃣ DESDE EL FRONTEND - Puedes crear una función en Supabase para que los admins promuevan usuarios:
*/

-- Función para que un admin pueda promover otros usuarios (solo admins pueden ejecutarla)
CREATE OR REPLACE FUNCTION promover_a_admin(usuario_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    usuario_actual_es_admin BOOLEAN;
BEGIN
    -- Verificar si quien ejecuta la función es admin
    SELECT EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol = 'admin'
    ) INTO usuario_actual_es_admin;
    
    IF NOT usuario_actual_es_admin THEN
        RAISE EXCEPTION 'Solo los administradores pueden promover usuarios';
    END IF;
    
    -- Promover al usuario
    UPDATE public.usuarios 
    SET rol = 'admin' 
    WHERE email = usuario_email;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario actual es admin (útil en el frontend)
CREATE OR REPLACE FUNCTION es_usuario_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND rol = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
RESUMEN:
✅ El PRIMER usuario registrado → ADMIN automático
✅ Los siguientes usuarios → CLIENTE por defecto
✅ Puedes promover manualmente con UPDATE en SQL Editor
✅ Los admins pueden promover otros usando la función promover_a_admin()
✅ Verifica roles en frontend con la función es_usuario_admin()

EJEMPLO DE USO EN FRONTEND (con Supabase JS):
const { data, error } = await supabase.rpc('es_usuario_admin');
if (data === true) {
  // Mostrar panel de administración
}
*/