import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function uploadFile(supabaseUrl: string, supabaseKey: string, file: any) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const fileContent = fs.readFileSync(file.path);
  const fileName = path.basename(file.path);

  const { data, error } = await supabase.storage
    .from('sonexa-files')
    .upload(`${file.type}/${fileName}`, fileContent, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from('sonexa-files').getPublicUrl(data.path);

  await supabase.from('files').insert([
    {
      id: file.id,
      filename: file.filename,
      type: file.type,
      duration: file.duration,
      size: file.size,
      tags: file.tags,
      bpm: file.bpm,
      storage_path: data.path,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    },
  ]);

  return { ...data, publicUrl: publicUrlData.publicUrl };
}
