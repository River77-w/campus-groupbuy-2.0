import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.fjxcxogytwrfgroupbuy.xyz');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  // 获取 URL 参数
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const campus = searchParams.get('campus');
  const category = searchParams.get('category');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 分类映射：前端选项 -> 数据库存储的值
  const categoryMap = {
    'food': '外卖',
    'drink': '奶茶',
    'supermarket': '超市',
    'other': '其他'
  };
  
  try {
    let query = supabase.from('groups').select('*');
    
    // 按校区精确筛选
    if (campus && campus !== 'all') {
      query = query.eq('location', campus);
    }
    
    // 按分类筛选
    if (category && category !== 'all') {
      const dbCategory = categoryMap[category];
      if (dbCategory) {
        query = query.eq('category', dbCategory);
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    console.error('API 错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
