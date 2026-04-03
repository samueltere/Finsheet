import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, Booking } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter,
  Search,
  PieChart,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export const AccountantDashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txs);
      
      const revenue = txs.reduce((acc, tx) => {
        if (tx.type === 'payment' || tx.type === 'service_charge') return acc + tx.amount;
        if (tx.type === 'refund') return acc - tx.amount;
        return acc;
      }, 0);
      setTotalRevenue(revenue);
    });

    return () => unsubscribe();
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tx.id.includes(searchQuery)
  );

  return (
    <div className="space-y-8">
      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase">Total Revenue</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
            <TrendingUp size={14} />
            <span>+12.5% from last month</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase">Avg. Daily Revenue</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">${(totalRevenue / 30).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <ArrowDownRight size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase">Refunds Processed</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ${transactions.filter(tx => tx.type === 'refund').reduce((acc, tx) => acc + tx.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
              <FileText size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase">Pending Audits</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">0</p>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">Financial Ledger</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-slate-500 uppercase">#{tx.id.slice(-8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">{new Date(tx.date).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{tx.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                      {tx.method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm font-bold ${
                      tx.type === 'refund' ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {tx.type === 'refund' ? '-' : '+'}${tx.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                      <CheckCircle2 size={14} />
                      <span>Verified</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center">
              <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No transactions found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
