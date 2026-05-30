import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://www.fjxcxogytwrfgroupbuy.xyz');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // 从 URL 参数中获取 id，例如 /api/group?id=1
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const id = searchParams.get('id');
  
  if (!id) {
    return res.status(400).json({ success: false, error: '缺少 id 参数' });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error) throw error;
    
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    console.error('获取详情失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
