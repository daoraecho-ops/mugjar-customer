import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://woxqtjkoeawreurbewtr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveHF0amtvZWF3cmV1cmJld3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTUwMDMsImV4cCI6MjA5MzkzMTAwM30.NrvSSNSZM2A8Sm1p5S8CsmKTcw0iIVcuS7pcPAUdmz0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── DB HELPERS ──────────────────────────────────────────────────────────────

// STAFF
export async function getStaffByPin(pin) {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('pin', pin)
    .limit(1);
  if (error || !data || data.length === 0) return null;
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
export async function earnPoints({ customer, billAmount, staffName, outlet }) {
  const pts = Math.floor(parseFloat(billAmount) * 0.05);
  const prevSpend = parseFloat(customer.total_spend);
  const newSpend = prevSpend + parseFloat(billAmount);
  const milestoneHit = prevSpend < 750 && newSpend >= 750 && !customer.milestone_awarded;
  const bonusPts = milestoneHit ? 200 : 0;
  const newPoints = customer.points + pts + bonusPts;

  const updated = await updateCustomerPoints({
    id: customer.id,
    points: newPoints,
    totalSpend: newSpend,
    milestoneAwarded: milestoneHit ? true : customer.milestone_awarded,
  });

  await addTransaction({ customerId: customer.id, type: 'earn', amount: billAmount, pointsChange: pts, staffName, outlet });
  if (milestoneHit) {
    await addTransaction({ customerId: customer.id, type: 'bonus', amount: 0, pointsChange: 200, staffName: 'System', outlet: 'System' });
  }

  return { updated, pts, bonusPts };
}

// REDEEM POINTS
export async function redeemPoints({ customer, redeemPts, billAmount, staffName, outlet }) {
  const newPoints = customer.points - parseInt(redeemPts);
  const updated = await updateCustomerPoints({ id: customer.id, points: newPoints });
  await addTransaction({ customerId: customer.id, type: 'redeem', amount: billAmount, pointsChange: -parseInt(redeemPts), staffName, outlet });
  return updated;
}
