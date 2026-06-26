import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
console.log("SUPABASE JS INIT:", supabaseUrl, supabaseKey ? 'Has Key' : 'No Key');
if (supabaseUrl && supabaseKey) {
  // Use the ws polyfill since Node.js 20 lacks native WebSockets
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false // Recommended for backend environments
    },
    realtime: {
      transport: ws
    }
  });
} else {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_KEY is missing. Database operations will fail.');
}

const createSupabaseCollection = (name) => {
  return {
    doc: (id) => ({
      get: async () => {
        const { data, error } = await supabase
          .from('documents')
          .select('data')
          .eq('collection_name', name)
          .eq('id', id)
          .single();
        
        return {
          exists: !!data,
          id,
          data: () => data?.data || null,
          ref: { id }
        };
      },
      set: async (docData, options) => {
        console.log('SUPABASE SET CALLED FOR:', name, id);
        if (options?.merge) {
          // Fetch existing to merge (simplified for now)
          const { data: existing } = await supabase
            .from('documents')
            .select('data')
            .eq('collection_name', name)
            .eq('id', id)
            .single();
          
          const mergedData = { ...(existing?.data || {}), ...docData };
          const { error: upsertError1 } = await supabase
            .from('documents')
            .upsert({ id, collection_name: name, data: mergedData });
          if (upsertError1) throw new Error(upsertError1.message);
        } else {
          console.log('UPSERTING INTO SUPABASE:', { id, collection_name: name, dataKeys: Object.keys(docData) });
          const { error: upsertError2 } = await supabase
            .from('documents')
            .upsert({ id, collection_name: name, data: docData });
          if (upsertError2) throw new Error(upsertError2.message);
        }
        return { id };
      },
      update: async (docData) => {
        const { data: existing } = await supabase
          .from('documents')
          .select('data')
          .eq('collection_name', name)
          .eq('id', id)
          .single();
        
        if (!existing) throw new Error('Document not found');
        
        const mergedData = { ...existing.data, ...docData };
        await supabase
          .from('documents')
          .update({ data: mergedData })
          .eq('id', id);
          
        return { id };
      },
      delete: async () => {
        await supabase
          .from('documents')
          .delete()
          .eq('id', id);
        return { id };
      },
      collection: (subName) => createSupabaseCollection(`${name}/${id}/${subName}`)
    }),
    add: async (docData) => {
      const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { error: insertError } = await supabase
        .from('documents')
        .insert({ id, collection_name: name, data: docData });
      if (insertError) throw new Error(insertError.message);
      return { id, path: `${name}/${id}` };
    },
    where: (...args) => createSupabaseQuery(name, [args]),
    orderBy: (...args) => createSupabaseQuery(name, [], [args]),
    limit: (n) => createSupabaseQuery(name, [], [], n),
    get: async () => {
      const { data: raw, error: rawErr } = await supabase.from('documents').select('*').eq('collection_name', name);
      console.log('RAW GET RESULT:', raw?.length);
      const { data, error } = await supabase
        .from('documents')
        .select('id, data')
        .eq('collection_name', name);
        
      if (error) throw error;
      
      const docs = (data || []).map(row => ({
        id: row.id,
        exists: true,
        data: () => row.data,
        ref: { id: row.id }
      }));
      return { docs, size: docs.length, empty: docs.length === 0 };
    }
  };
};

const createSupabaseQuery = (name, whereArgs = [], orderArgs = [], limitNum = 100) => {
  return {
    where: (...args) => createSupabaseQuery(name, [...whereArgs, args], orderArgs, limitNum),
    orderBy: (...args) => createSupabaseQuery(name, whereArgs, [...orderArgs, args], limitNum),
    limit: (n) => createSupabaseQuery(name, whereArgs, orderArgs, n),
    startAfter: () => createSupabaseQuery(name, whereArgs, orderArgs, limitNum),
    get: async () => {
      let query = supabase.from('documents').select('id, data').eq('collection_name', name);
      
      // We have to filter JSONB data. Supabase uses Postgres JSON operators.
      for (const [field, op, value] of whereArgs) {
        if (!field) continue;
        
        const pathParts = field.split('.');
        const lastPart = pathParts.pop();
        const jsonPath = pathParts.length > 0 
          ? `data->${pathParts.join('->')}->>${lastPart}`
          : `data->>${lastPart}`;
        
        switch (op) {
          case '==': 
            query = query.eq(jsonPath, value); 
            break;
          case '!=': 
            query = query.neq(jsonPath, value); 
            break;
          case '>': 
            query = query.gt(jsonPath, value); 
            break;
          case '>=': 
            query = query.gte(jsonPath, value); 
            break;
          case '<': 
            query = query.lt(jsonPath, value); 
            break;
          case '<=': 
            query = query.lte(jsonPath, value); 
            break;
          // 'in' and 'array-contains' are harder to map dynamically to stringified JSONB in PostgREST,
          // so we might need to filter them post-query if they get too complex.
          // For now, we fetch more and filter in memory if needed for complex ops:
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let results = data || [];
      
      // In-memory filter fallback for complex operators that weren't mapped
      for (const [field, op, value] of whereArgs) {
        if (op === 'in') {
          results = results.filter(row => Array.isArray(value) && value.includes(row.data[field]));
        } else if (op === 'array-contains') {
          results = results.filter(row => Array.isArray(row.data[field]) && row.data[field].includes(value));
        }
      }

      // In-memory sort
      for (const [field, dir] of orderArgs) {
        results.sort((a, b) => {
          const valA = a.data[field];
          const valB = b.data[field];
          if (valA < valB) return dir === 'desc' ? 1 : -1;
          if (valA > valB) return dir === 'desc' ? -1 : 1;
          return 0;
        });
      }
      
      if (limitNum) {
        results = results.slice(0, limitNum);
      }

      const docs = results.map(row => ({
        id: row.id,
        exists: true,
        data: () => row.data,
        ref: { id: row.id }
      }));
      return { docs, size: docs.length, empty: docs.length === 0 };
    }
  };
};

export const supabaseDb = {
  collection: createSupabaseCollection,
  batch: () => ({
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: async () => {}
  }),
  runTransaction: async (fn) => {
    const transaction = {
      get: async (ref) => ({ exists: false, data: () => null }),
      set: () => {},
      update: () => {},
      delete: () => {}
    };
    return fn(transaction);
  }
};

export { supabase as supabaseClient };
