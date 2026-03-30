import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Coins, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Trophy,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { COIN_PACKAGES } from './lib/constants';

const STEPS = ['Verify ID', 'Package', 'Details', 'Payment'];

function App() {
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(COIN_PACKAGES[1]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Animation variants
  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const handleVerifyId = async () => {
    if (!userId) return setError('User ID is required');
    setLoading(true);
    setError('');
    
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('user_id, display_name, coins')
        .eq('user_id', userId.toUpperCase())
        .single();

      if (fetchError || !data) {
        throw new Error('User not found. Please check your ID in the app.');
      }

      setUserProfile(data);
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!/^\d{10}$/.test(phone)) return setError('Enter a valid 10-digit mobile number');
    
    setLoading(true);
    setError('');

    try {
      // Call the create-payment-order Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('create-payment-order', {
        body: {
          user_id: userProfile.user_id,
          phone: `+91${phone}`,
          coins: selectedPackage.coins + (selectedPackage.bonus || 0),
          amount: selectedPackage.amount,
          package_name: selectedPackage.name
        }
      });

      if (funcError || !data?.payment_session_id) {
        throw new Error(data?.error || 'Failed to create payment session');
      }

      // Initialize Cashfree
      const cashfree = window.Cashfree({ mode: 'production' });
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_modal'
      };

      const result = await cashfree.checkout(checkoutOptions);

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentDetails?.paymentStatus === 'SUCCESS' || result.redirect) {
        setPaymentSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="glass-card text-center animate-fade-in">
        <div className="success-icon">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Coins will be added to your account <b>{userProfile?.user_id}</b> instantly.
        </p>
        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-4 rounded-xl text-white mb-6">
          <div className="text-sm opacity-80">Added to Wallet</div>
          <div className="text-3xl font-black">{selectedPackage.coins + (selectedPackage.bonus || 0)} Coins</div>
        </div>
        <button 
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          Buy More Coins
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full px-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl text-deep mb-2">Vidya Topper</h1>
        <p className="text-orange-600 font-bold flex items-center justify-center gap-2">
          <Zap size={18} /> Coin Recharge Portal
        </p>
      </header>

      <div className="glass-card">
        {/* Step Indicator */}
        <div className="step-indicator">
          {STEPS.map((s, i) => (
            <div key={i} className={`step-dot ${i <= step ? 'active' : ''}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h2 className="text-xl mb-4 flex items-center gap-2">
                <User className="text-orange-500" /> Verify Your Identity
              </h2>
              <p className="text-gray-500 text-sm mb-6">Enter your User ID from the Vidya Topper app profile.</p>
              
              <div className="space-y-4">
                <input 
                  className="input-field"
                  placeholder="e.g. VT-USER-12345"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyId()}
                />
                
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-lg border border-red-100">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button 
                  className="btn-primary" 
                  onClick={handleVerifyId}
                  disabled={loading || !userId}
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl flex items-center gap-2">
                  <Coins className="text-orange-500" /> Pick a Package
                </h2>
                <button className="text-sm text-gray-400 hover:text-orange-500 flex items-center gap-1" onClick={() => setStep(0)}>
                  <ArrowLeft size={14} /> Back
                </button>
              </div>

              <div className="package-grid">
                {COIN_PACKAGES.map((pkg) => (
                  <div 
                    key={pkg.id}
                    className={`package-card ${selectedPackage.id === pkg.id ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <div className="text-2xl font-black text-deep">{pkg.coins}</div>
                    <div className="text-xs text-gray-400 font-bold mb-3">COINS</div>
                    <div className="bg-gradient-to-br from-orange-500 to-yellow-500 text-white py-1 px-3 rounded-full text-sm font-bold">
                      ₹{pkg.amount}
                    </div>
                    {pkg.bonus > 0 && (
                      <div className="text-green-500 text-[10px] font-black mt-2">
                        +{pkg.bonus} BONUS!
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                className="btn-primary mt-8"
                onClick={() => setStep(2)}
              >
                Choose This Pack
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h2 className="text-xl mb-4 flex items-center gap-2">
                <Smartphone className="text-orange-500" /> Contact Details
              </h2>
              <p className="text-gray-500 text-sm mb-6">Enter your mobile number for payment confirmation.</p>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 border-r pr-3">+91</span>
                  <input 
                    className="input-field pl-16"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-lg">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button 
                  className="btn-primary"
                  onClick={() => setStep(3)}
                  disabled={phone.length !== 10}
                >
                  Proceed to Pay
                </button>
                <button className="text-sm text-gray-400 w-full text-center hover:text-orange-500" onClick={() => setStep(1)}>
                   Edit Package
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h2 className="text-xl mb-6 flex items-center gap-2">
                <CreditCard className="text-orange-500" /> Order Summary
              </h2>

              <div className="bg-orange-50 rounded-2xl p-6 mb-8 border border-orange-100">
                <div className="flex justify-between mb-3 text-sm text-gray-500">
                  <span>User ID</span>
                  <span className="font-bold text-deep">{userProfile.user_id}</span>
                </div>
                <div className="flex justify-between mb-3 text-sm text-gray-500">
                  <span>Package</span>
                  <span className="font-bold text-deep">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between mb-4 text-sm text-gray-500">
                  <span>Total Coins</span>
                  <span className="font-bold text-orange-600 flex items-center gap-1">
                    <Trophy size={14} /> {selectedPackage.coins + (selectedPackage.bonus || 0)}
                  </span>
                </div>
                <div className="border-t border-dashed border-orange-200 pt-4 flex justify-between items-center">
                  <span className="font-black text-deep">Amount Payable</span>
                  <span className="text-2xl font-black text-orange-600">₹{selectedPackage.amount}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-lg mb-4">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button 
                className="btn-primary"
                onClick={handleInitiatePayment}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Pay via Cashfree'}
              </button>
              <p className="text-[10px] text-center text-gray-400 mt-4 uppercase tracking-widest font-bold">
                100% Secure SSL Payment
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="text-center mt-8 text-gray-400 text-xs flex items-center justify-center gap-1 font-bold">
        Powered by <img src="https://www.cashfree.com/wp-content/themes/cashfree/assets/images/logo.svg" alt="Cashfree" className="h-3 grayscale" />
      </footer>
    </div>
  );
}

export default App;
