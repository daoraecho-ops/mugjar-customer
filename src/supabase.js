import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── DB HELPERS ──────────────────────────────────────────────────────────────

// STAFF
export async function getStaffByPin(pin) {
  const { data, error } = await supabase
    .rpc('verify_staff_pin', { input_pin: String(pin) });
  if (error) { console.error('PIN verify error:', error); return null; }
  if (!data || data.length === 0) return null;
  return data[0];
}

// CUSTOMERS
export async function getCustomerByPhone(phone) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();
  if (error) return null;
  return data;
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
  const id = 'C' + Math.random().toString(36).slice(2,8).toUpperCase();
  const { data, error } = await supabase
    .from('customers')
    .insert([{ id, name, phone, points: 20, total_spend: 0, milestone_awarded: false }])
    .select()
    .single();
  if (error) throw error;
  // signup bonus transaction
  await addTransaction({
    customerId: data.id,
    type: 'bonus',
    amount: 0,
    pointsChange: 20,
    staffName: 'System',
    outlet: 'System',
  });
  return data;
}

export async function updateCustomerPoints({ id, points, totalSpend, milestoneAwarded }) {
  const update = { points };
  if (totalSpend !== undefined) update.total_spend = totalSpend;
  if (milestoneAwarded !== undefined) update.milestone_awarded = milestoneAwarded;
  const { data, error } = await supabase
    .from('customers')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// TRANSACTIONS
export async function addTransaction({ customerId, type, amount, pointsChange, staffName, outlet }) {
  const id = 'T' + Math.random().toString(36).slice(2,8).toUpperCase();
  const { error } = await supabase
    .from('transactions')
    .insert([{ id, customer_id: customerId, type, amount, points_change: pointsChange, staff_name: staffName, outlet }]);
  if (error) throw error;
}

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
    .from('transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

// EARN POINTS
// ─── TIER SYSTEM ─────────────────────────────────────────────────────────────
export const TIERS = [
  { name: 'Bronze',   icon: '🥉', min: 0,     max: 750,   rate: 0.05, bonus: 0,    color: '#cd7f32' },
  { name: 'Silver',   icon: '🥈', min: 751,   max: 2000,  rate: 0.06, bonus: 300,  color: '#a8a9ad' },
  { name: 'Gold',     icon: '🥇', min: 2001,  max: 4500,  rate: 0.07, bonus: 500,  color: '#d4a44c' },
  { name: 'Platinum', icon: '💎', min: 4501,  max: 7499,  rate: 0.075,bonus: 800,  color: '#e5e4e2' },
  { name: 'Diamond',  icon: '👑', min: 7500,  max: Infinity, rate: 0.08, bonus: 1500, color: '#b9f2ff' },
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
  for (let i = 0; i < TIERS.length; i++) {
    if (spend < TIERS[i].max && TIERS[i].max !== Infinity) return TIERS[i + 1] || null;
    if (spend <= TIERS[i].max) return TIERS[i + 1] || null;
  }
  return null;
}

export async function earnPoints({ customer, billAmount, staffName, outlet }) {
  const prevSpend = parseFloat(customer.total_spend || 0);
  const newSpend  = prevSpend + parseFloat(billAmount);

  // Earn rate based on NEW tier after this spend
  const newTier  = getTier(newSpend);
  const pts      = Math.floor(parseFloat(billAmount) * newTier.rate);

  // Check tier upgrade bonuses
  const prevTier = getTier(prevSpend);
  let tierBonusPts = 0;
  let tierUpgraded = false;

  if (newTier.name !== prevTier.name) {
    tierBonusPts = newTier.bonus;
    tierUpgraded = true;
  }

  const newPoints = customer.points + pts + tierBonusPts;

  const updated = await updateCustomerPoints({
    id: customer.id,
    points: newPoints,
    totalSpend: newSpend,
    milestoneAwarded: customer.milestone_awarded,
  });

  await addTransaction({ customerId: customer.id, type: 'earn', amount: billAmount, pointsChange: pts, staffName, outlet });

  if (tierUpgraded && tierBonusPts > 0) {
    await addTransaction({
      customerId: customer.id, type: 'bonus', amount: 0,
      pointsChange: tierBonusPts, staffName: 'System',
      outlet: `Tier Upgrade: ${newTier.name}`
    });
  }

  return { updated, pts, bonusPts: tierBonusPts, tierUpgraded, newTier, prevTier };
}

// REDEEM POINTS
export async function redeemPoints({ customer, redeemPts, billAmount, staffName, outlet }) {
  const newPoints = customer.points - parseInt(redeemPts);
  const updated = await updateCustomerPoints({ id: customer.id, points: newPoints });
  await addTransaction({ customerId: customer.id, type: 'redeem', amount: billAmount, pointsChange: -parseInt(redeemPts), staffName, outlet });
  return updated;
}
