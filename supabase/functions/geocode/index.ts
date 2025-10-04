import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eleitores } = await req.json();
    console.log(`Geocoding ${eleitores?.length || 0} eleitores`);

    if (!eleitores || !Array.isArray(eleitores) || eleitores.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum eleitor fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = [];
    
    for (const eleitor of eleitores) {
      try {
        // Build address string
        const addressParts = [
          eleitor.endereco,
          eleitor.numero,
          eleitor.bairro,
          eleitor.cidade,
          eleitor.estado,
          eleitor.cep
        ].filter(Boolean);

        if (addressParts.length === 0) {
          console.log(`Eleitor ${eleitor.id}: sem endereço`);
          results.push({ id: eleitor.id, success: false, reason: 'sem_endereco' });
          continue;
        }

        const address = addressParts.join(', ');
        console.log(`Geocoding: ${address}`);

        // Call Nominatim API (free, no key required)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(address)}` +
          `&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'GabineteApp/1.0'
            }
          }
        );

        if (!response.ok) {
          console.error(`API error for ${eleitor.id}:`, response.status);
          results.push({ id: eleitor.id, success: false, reason: 'api_error' });
          continue;
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          // Update eleitor with coordinates
          const { error: updateError } = await supabase
            .from('eleitores')
            .update({
              latitude: lat,
              longitude: lon
            })
            .eq('id', eleitor.id);

          if (updateError) {
            console.error(`Update error for ${eleitor.id}:`, updateError);
            results.push({ id: eleitor.id, success: false, reason: 'update_error' });
          } else {
            console.log(`Success for ${eleitor.id}: ${lat}, ${lon}`);
            results.push({ 
              id: eleitor.id, 
              success: true, 
              latitude: lat, 
              longitude: lon 
            });
          }
        } else {
          console.log(`No results for ${eleitor.id}`);
          results.push({ id: eleitor.id, success: false, reason: 'nao_encontrado' });
        }

        // Rate limiting: wait 1 second between requests (Nominatim requirement)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing ${eleitor.id}:`, error);
        results.push({ id: eleitor.id, success: false, reason: 'erro_processamento' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Geocoding complete: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({ results, successCount, totalCount: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Geocode error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});