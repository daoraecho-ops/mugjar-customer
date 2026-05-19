import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── TIER SYSTEM ─────────────────────────────────────────────────────────────
export const TIERS = [
  { name: 'Bronze',   icon: '🥉', min: 0,    rate: 0.05,  bonus: 0,    color: '#cd7f32' },
  { name: 'Silver',   icon: '🥈', min: 751,  rate: 0.06,  bonus: 300,  color: '#a8a9ad' },
  { name: 'Gold',     icon: '🥇', min: 2001, rate: 0.07,  bonus: 500,  color: '#d4a44c' },
  { name: 'Platinum', icon: '💎', min: 4501, rate: 0.075, bonus: 800,  color: '#e5e4e2' },
  { name: 'Diamond',  icon: '👑', min: 7500, rate: 0.08,  bonus: 1500, color: '#b9f2ff' },
];

export function getTier(totalSpend) {
  const spend = parseFloat(totalSpend || 0);
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (spend >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

export function getNextTier(totalSpend) {
  const spend = parseFloat(totalSpend || 0);
  const idx = TIERS.findIndex(t => t.name === getTier(spend).name);
  return TIERS[idx + 1] || null;
}

// ─── STAFF ───────────────────────────────────────────────────────────────────
export async function getStaffByPin(pin) {
  const { data, error } = await supabase
    .rpc('verify_staff_pin', { input_pin: String(pin) });
  if (error) { console.error('PIN verify error:', error); return null; }
  if (!data || data.length === 0) return null;
  return data[0];
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
export async function getCustomerByPhone(phone) {
  const { data, error } = await supabase
    .rpc('get_customer_by_phone', { cust_phone: phone });
  if (error || !data || data.length === 0) return null;
  return data[0];
}

export async function getAllCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('join_date', { ascending: false });
  if (error) return [];
  return data;
}

export async function createCustomer({ name, phone }) {
  const id = 'C' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const { data, error } = await supabase
    .from('customers')
    .insert([{ id, name, phone, points: 20, total_spend: 0, milestone_awarded: false }])
    .select()
    .single();
  if (error) throw error;
  await supabase.from('transactions').insert([{
    id: 'T' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    customer_id: data.id, type: 'bonus',
    amount: 0, points_change: 20,
    staff_name: 'System', outlet: 'System',
  }]);
  return data;
}

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────
export async function getTransactions({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, customers(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data;
}

export async function getCustomerTransactions(customerId) {
  const { data, error } = await supabase
    .rpc('get_customer_transactions', { cust_id: customerId });
  if (error) return [];
  return data;
}

// ─── EARN POINTS (via secure server function) ────────────────────────────────
export async function earnPoints({ customer, billAmount, staffName, outlet }) {
  const { data, error } = await supabase.rpc('earn_points', {
    p_customer_id: customer.id,
    p_bill_amount: parseFloat(billAmount),
    p_staff_name:  staffName,
    p_outlet:      outlet,
  });
  if (error) throw error;

  const result    = typeof data === 'string' ? JSON.parse(data) : data;
  const prevTier  = getTier(customer.total_spend);
  const newTier   = TIERS.find(t => t.name === result.newTier) || prevTier;

  // Fetch updated customer
  const { data: updated } = await supabase
    .from('customers').select('*').eq('id', customer.id).single();

  return {
    updated,
    pts:          result.pts,
    bonusPts:     result.bonusPts,
    tierUpgraded: result.tierUpgraded,
    newTier,
    prevTier,
  };
}

// ─── REDEEM POINTS (via secure server function) ──────────────────────────────
export async function redeemPoints({ customer, redeemPts, billAmount, staffName, outlet }) {
  const { data, error } = await supabase.rpc('redeem_points', {
    p_customer_id: customer.id,
    p_redeem_pts:  parseInt(redeemPts),
    p_bill_amount: parseFloat(billAmount),
    p_staff_name:  staffName,
    p_outlet:      outlet,
  });
  if (error) throw error;

  const result = typeof data === 'string' ? JSON.parse(data) : data;
  if (result.error) throw new Error(result.error);

  const { data: updated } = await supabase
    .from('customers').select('*').eq('id', customer.id).single();
  return updated;
}
