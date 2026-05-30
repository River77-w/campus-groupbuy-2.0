import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.fjxcxogytwrfgroupbuy.xyz');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { title, description, category, location, currentCount, targetCount, totalAmount, expireTime, image, organizer } = req.body;
    
    const newGroup = {
      title,
      description,
      category,
      location,
      current_count: currentCount || 1,
      target_count: targetCount,
      total_amount: totalAmount || 0,
      expire_time: expireTime,
      image,
      organizer,
      status: 'active'
    };
    
    const { data, error } = await supabase
      .from('groups')
      .insert([newGroup])
      .select();
    
    if (error) throw error;
    res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('创建失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
