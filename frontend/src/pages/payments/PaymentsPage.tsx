import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const API_URL = 'http://localhost:5000/api';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed';
  description: string;
  createdAt: string;
}

export const PaymentsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  // form state
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [description, setDescription] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const token = localStorage.getItem('business_nexus_token');

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/payments/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePayment = async () => {
    setError('');
    setSuccess('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!cardNumber || !expiry || !cvv) {
      setError('Please fill in all card details');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid 16-digit card number');
      return;
    }

    setProcessing(true);

    // simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const res = await fetch(`${API_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} of $${amount} completed successfully!`);
      setAmount('');
      setDescription('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      fetchHistory();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const formatCard = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const getStatusVariant = (status: string) => {
    if (status === 'Completed') return 'success';
    if (status === 'Failed') return 'error';
    return 'warning';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'deposit') return <ArrowDownCircle size={18} className="text-green-500" />;
    if (type === 'withdraw') return <ArrowUpCircle size={18} className="text-red-500" />;
    return <ArrowRightCircle size={18} className="text-blue-500" />;
  };

  const totalDeposited = transactions
    .filter(t => t.type === 'deposit' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = transactions
    .filter(t => t.type === 'withdraw' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Manage your transactions and payment history</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <ArrowDownCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Deposited</p>
                <p className="text-xl font-bold text-gray-900">${totalDeposited.toFixed(2)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <ArrowUpCircle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Withdrawn</p>
                <p className="text-xl font-bold text-gray-900">${totalWithdrawn.toFixed(2)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-xl font-bold text-gray-900">{transactions.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">New Transaction</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['deposit', 'withdraw', 'transfer'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`py-2 px-3 border rounded-md text-sm font-medium transition-colors ${
                        type === t
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Investment deposit"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Mock Card Details */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Card Details
                  <span className="ml-2 text-xs text-gray-400">(Test: 4242 4242 4242 4242)</span>
                </p>
                <div className="space-y-3">
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCard(e.target.value))}
                    maxLength={19}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      maxLength={5}
                    />
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="CVV"
                      value={cvv}
                      onChange={e => setCvv(e.target.value)}
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>

              <Button
                fullWidth
                onClick={handlePayment}
                isLoading={processing}
                leftIcon={<DollarSign size={16} />}
              >
                {processing ? 'Processing...' : `Confirm ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <p className="text-gray-500 text-sm">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map(transaction => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTypeIcon(transaction.type)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {transaction.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </p>
                      <Badge variant={getStatusVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};