import React, { useState, useEffect } from 'react';
import { 
  Upload, CheckCircle, Image as ImageIcon, Send, User, 
  ChevronRight, ChevronLeft, Heart, ClipboardCheck, Loader2, Cloud, AlertCircle, RefreshCcw
} from 'lucide-react';

const App = () => {
  const [step, setStep] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    orderId: '',
    name: '',
    petName: ''
  });

  // 【最重要】あなたがデプロイした最新のGASのURL（https://script.google.com/.../exec）に書き換えてください
  const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwmvNxvhbPBA0ikrWOCxdODXC-4XnIBsotH_kyFOMCvX6N2Vopd1FxEWh6hZlTLbqOZ/exec"; 

  // 指定された16個のフレーズ
  const phrases = [
    "おはよう", "おやすみ", "了解", "ごめん。",
    "ぺこり", "ありがとう", "頑張って！", "え…",
    "はーい！", "GOOD", "お疲れ様", "怒",
    "まじ！？", "（ハート）", "よろしく", "ちーん。"
  ];

  const [previews, setPreviews] = useState(Array(16).fill(null));

  const optimizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 1200; 
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
      };
    });
  };

  const handleImageChange = async (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const optimizedBase64 = await optimizeImage(file);
      const newPreviews = [...previews];
      newPreviews[index] = optimizedBase64;
      setPreviews(newPreviews);
    }
  };

  const isStep1Valid = customerInfo.orderId.trim() !== '' && 
                       customerInfo.name.trim() !== '' && 
                       customerInfo.petName.trim() !== '';
  
  const uploadedCount = previews.filter(p => p !== null).length;
  const isStep2Valid = uploadedCount === 16;

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  // =======================================
  // ★ 修正箇所: mode:'no-cors'を削除
  // =======================================
  const handleFinalSubmit = async () => {
    if (!GAS_WEBAPP_URL || GAS_WEBAPP_URL.includes("貼り付けてください")) {
      setErrorMessage("システム設定（GAS URL）が完了していません。管理者側でURLを設定してください。");
      return;
    }

    setIsSending(true);
    setErrorMessage("");
    setUploadProgress(10);

    const payload = {
      orderId: customerInfo.orderId,
      name: customerInfo.name,
      petName: customerInfo.petName,
      images: previews,
      phrases: phrases
    };

    const sendWithRetry = async (retryCount = 0) => {
      try {
        setUploadProgress(20 + (retryCount * 15));
        
        // ★ mode:'no-cors'を削除し、レスポンスを正しく受け取れるようにした
        const response = await fetch(GAS_WEBAPP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.result === "success") {
          setUploadProgress(100);
          setTimeout(() => {
            setIsSending(false);
            setStep(4);
          }, 800);
        } else {
          throw new Error(result.message || "GASエラー");
        }

      } catch (error) {
        if (retryCount < 3) {
          setTimeout(() => sendWithRetry(retryCount + 1), 2000);
        } else {
          console.error("Submission failed:", error);
          setErrorMessage("通信エラーが発生しました。インターネット接続を確認して、もう一度送信してください。");
          setIsSending(false);
        }
      }
    };

    sendWithRetry();
  };

  const resetToTop = () => {
    setStep(1);
    setCustomerInfo({ orderId: '', name: '', petName: '' });
    setPreviews(Array(16).fill(null));
    setUploadProgress(0);
    setErrorMessage("");
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        
        {isSending && (
          <div className="fixed inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-800 mb-2 font-sans">送信中...</h3>
            <p className="text-slate-500 mb-8 font-medium text-sm">
              画像を送信しています。完了まで数分かかる場合があります。<br />
              画面を閉じずにお待ちください。
            </p>
            <div className="w-full max-w-sm bg-slate-100 h-2 rounded-full overflow-hidden mx-auto shadow-inner">
              <div 
                className={`bg-blue-600 h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="flex justify-between items-center max-w-xs mx-auto mb-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                  step === i ? 'bg-blue-600 text-white scale-110 shadow-blue-200' : step > i ? 'bg-green-500 text-white' : 'bg-white text-slate-300 border border-slate-200'
                }`}>
                  {step > i ? <CheckCircle size={20} /> : i}
                </div>
                {i < 3 && <div className={`w-12 h-0.5 mx-2 ${step > i ? 'bg-green-500' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>
        )}

        <main>
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] shadow-sm p-10 border border-slate-100 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="text-blue-500" size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-10">お客様情報の入力</h2>
                <div className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 ml-1">注文番号</label>
                    <input 
                      type="text" 
                      placeholder="注文番号を入力"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                      value={customerInfo.orderId}
                      onChange={(e) => setCustomerInfo({...customerInfo, orderId: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 ml-1">飼い主様のお名前</label>
                    <input 
                      type="text" 
                      placeholder="お名前を入力"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 ml-1">ペットのお名前</label>
                    <input 
                      type="text" 
                      placeholder="ペットのお名前を入力"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                      value={customerInfo.petName}
                      onChange={(e) => setCustomerInfo({...customerInfo, petName: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={nextStep}
                disabled={!isStep1Valid}
                className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isStep1Valid ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                写真の選択に進む
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-600 text-white p-5 rounded-3xl flex items-center justify-between shadow-lg sticky top-4 z-20 border border-blue-400">
                <span className="font-bold flex items-center gap-2 text-sm"><ImageIcon size={18}/> 画像を選択（16枚）</span>
                <span className="font-black tracking-widest text-lg">{uploadedCount} <span className="text-blue-200 text-sm font-medium">/ 16</span></span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {phrases.map((phrase, index) => (
                  <div key={index} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:border-blue-200 transition-all">
                    <div className="bg-slate-50 px-3 py-3 border-b border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">No.{index+1}</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{phrase}</p>
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-center">
                      <div 
                        className={`relative aspect-square w-full rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                          previews[index] ? 'border-blue-400 bg-white' : 'border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200'
                        }`}
                        onClick={() => document.getElementById(`file-${index}`).click()}
                      >
                        {previews[index] ? (
                          <img src={previews[index]} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="text-center">
                            <Upload className="text-slate-200 mx-auto mb-1 group-hover:text-blue-300 transition-colors" size={28} />
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">追加</span>
                          </div>
                        )}
                        <input 
                          id={`file-${index}`}
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageChange(index, e)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4 pt-6">
                <button onClick={prevStep} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-3xl font-bold transition-all hover:bg-slate-50">
                  戻る
                </button>
                <button 
                  onClick={nextStep} 
                  disabled={!isStep2Valid}
                  className={`flex-[2] py-4 rounded-3xl font-bold text-white shadow-xl transition-all ${
                    isStep2Valid ? 'bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-1 active:scale-95 shadow-blue-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  提出内容を確認する
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] shadow-sm p-10 border border-slate-100">
                <div className="flex items-center gap-2 mb-8 border-b border-slate-50 pb-6">
                  <ClipboardCheck className="text-blue-500" size={28} />
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">最終確認</h2>
                </div>
                
                <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 text-sm mb-10 shadow-inner">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">注文番号</p>
                      <p className="text-slate-800 font-black text-lg">{customerInfo.orderId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">飼い主様のお名前</p>
                      <p className="text-slate-800 font-black text-lg">{customerInfo.name}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-blue-100 space-y-1">
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">ペットのお名前</p>
                    <p className="text-slate-800 font-black text-lg">{customerInfo.petName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {previews.map((src, i) => (
                    <div key={i} className="aspect-square rounded-[1rem] overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                      <img src={src} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
                
                <div className="mt-10 flex items-start gap-3 text-slate-500 bg-slate-50 p-6 rounded-3xl text-xs leading-relaxed border border-slate-100">
                  <AlertCircle size={20} className="shrink-0 text-amber-500" />
                  <div>
                    <p className="font-bold text-slate-800 mb-1">送信ボタンを押した後の動作について</p>
                    <p>
                      「送信して完了」を押すと送信を開始します。完了画面に切り替わるまで画面を閉じないでください。
                    </p>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-6 bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-pulse">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="font-bold">{errorMessage}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl font-bold transition-all hover:bg-slate-50 active:scale-95">
                  修正する
                </button>
                <button 
                  onClick={handleFinalSubmit}
                  className="flex-[2] bg-green-500 hover:bg-green-600 text-white py-5 rounded-3xl font-bold shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 hover:-translate-y-1 shadow-green-100"
                >
                  送信して完了 <Send size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-20 animate-in zoom-in duration-1000">
              <div className="bg-white rounded-[4rem] shadow-xl p-16 border border-slate-100 max-w-md mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner border border-green-100">
                  <Heart className="text-green-500 w-12 h-12 fill-current animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">送信完了しました</h2>
                <p className="text-slate-600 leading-relaxed text-lg mb-10">
                  大切にお預かりしました。<br />
                  ありがとうございました！
                </p>
                <div className="w-20 h-1 bg-slate-100 mx-auto rounded-full mb-10" />
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  写真は正常に保存されました。<br />
                  これより制作を開始します。
                </p>
              </div>
              
              <button 
                onClick={resetToTop}
                className="mt-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] hover:text-blue-500 flex items-center justify-center gap-2 mx-auto transition-colors"
              >
                <RefreshCcw size={14} /> TOPへ
              </button>
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-slate-200 text-[10px] tracking-[0.3em] uppercase font-black">
          Memory studio.
        </footer>
      </div>
    </div>
  );
};

export default App;
