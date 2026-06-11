 -- 1. Tabla para registrar las visitas a los pueblos
 create table visits (
   id uuid default gen_random_uuid() primary key,
   town_id text not null unique, -- Aquí guardamos el ID del municipio
   town_name text not null,      -- Nombre del pueblo
   description text,             -- Tu experiencia
   rating integer check (rating >= 1 and rating <= 5), -- Calificación 1-5
   created_at timestamp with time zone default now() not null
 );
  
   -- 2. Tabla para las fotos de cada visita
   create table visit_photos (
     id uuid default gen_random_uuid() primary key,
     visit_id uuid references visits(id) on delete cascade not null,
     image_url text not null,      -- Link de la foto en el Storage
     is_main boolean default false, -- Si es la que se muestra en el mapa
     created_at timestamp with time zone default now() not null
   );

-- Políticas para la tabla 'visits'
 create policy "Permitir lectura pública en visits" on visits for select using (true);
 create policy "Permitir inserción pública en visits" on visits for insert with check (true);
 create policy "Permitir actualización pública en visits" on visits for update using (true);
 create policy "Permitir borrado público en visits" on visits for delete using (true);

 -- Políticas para la tabla 'visit_photos'
 create policy "Permitir lectura pública en visit_photos" on visit_photos for select using (true);
 create policy "Permitir inserción pública en visit_photos" on visit_photos for insert with check (true);
 create policy "Permitir actualización pública en visit_photos" on visit_photos for update using (true);
 create policy "Permitir borrado público en visit_photos" on visit_photos for delete using (true);

-- 1. Permitir que cualquiera pueda ver las fotos (Lectura)
create policy "Acceso público de lectura"
on storage.objects for select
using ( bucket_id = 'town_photos' );

-- 2. Permitir que cualquiera pueda subir fotos (Inserción)
create policy "Acceso público de subida"
on storage.objects for insert
with check ( bucket_id = 'town_photos' );

-- 3. Permitir que cualquiera pueda borrar sus fotos (Eliminación)
create policy "Acceso público de borrado"
on storage.objects for delete
using ( bucket_id = 'town_photos' );

-- 4. Permitir actualizar fotos
create policy "Acceso público de actualización"
on storage.objects for update
using ( bucket_id = 'town_photos' );