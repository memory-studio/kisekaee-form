import React, { useState } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  ChevronRight, 
  MessageCircle, 
  AlertCircle, 
  Send, 
  Smartphone, 
  Grid, 
  Eye,
  Loader2
} from 'lucide-react';

const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbw2Qy8JAZI0x7QA4tXuUV5RbbaGSZAyZRqSflzKfLWfQVQCdF7EiFEff15pANVQLWQe/exec";

const ImageUploadSlot = ({ id, label, description, preview, onUpload, isRequired = false }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div>
        <label className="font-bold text-gray-800 block text-sm">
          {label} {isRequired && <span className="text-pink-500">*</span>}
        </label>
        {description && <p className="text-[10px] text-gray-500 leading-tight">{description}</p>}
      </div>
    </div>
    <div 
      onClick={() => document.getElementById(`file-${id}`).click()}
      className={`mt-2 aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${
        preview ? 'border-pink-400 bg-white' : 'border-gray-200 bg-gray-50 hover:bg-pink-50 hover:border-pink-200'
      }`}
    >
      {preview ? (
        <img src={preview} alt="preview" className="w-full h-full object-cover" />
      ) : (
        <>
          <Camera className="w-5 h-5 text-gray-300 mb-1" />
          <span className="text-[10px] text-gray-400">選択</span>
        </>
      )}
    </div>
    <input 
      id={`file-${id}`} 
      type="file" 
      className="hidden" 
      accept="image/*"
      onChange={(e) => onUpload(id, e.target.files[0])}
    />
  </div>
);

const App = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSample, setActiveSample] = useState('bg');
  const [receiptNumber, setReceiptNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    orderNumber: '',
    ownerName: '',
    petName: '',
    images: {},
  });

  const samples = {
    bg: "https://i.imgur.com/OsaqQIc.jpg",
    pass: "https://i.imgur.com/0OaIMws.jpg",
    menu: "https://i.imgur.com/MXiTESN.jpg"
  };

  const menuLabels = [
    "ホーム", "トーク", "VOOM", 
    "ショッピング", "通話", "ニュース", 
    "TODAY", "ウォレット", "MINI"
  ];

  const resizeImage = (base64Str) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSide = 1200;
        if (width > height) {
          if (width > maxSide) { height *= maxSide / width; width = maxSide; }
        } else {
          if (height > maxSide) { width *= maxSide / height; height = maxSide; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = base64Str;
    });
  };

  const handleUpload = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        images: { ...prev.images, [id]: reader.result }
      }));
    };
    reader.readAsDataURL(file);
  };

  const generateReceipt = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'M-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const resizedImages = {};
      for (const key of Object.keys(formData.images)) {
        try {
          resizedImages[key] = await resizeImage(formData.images[key]);
        } catch (err) {
          resizedImages[key] = formData.images[key];
        }
      }

      const payload = {
        orderNumber: formData.orderNumber,
        ownerName: formData.ownerName,
        petName: formData.petName,
        images: resizedImages
      };

      await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      setReceiptNumber(generateReceipt());
      setStep(4);

    } catch (error) {
      console.error("Submission Error:", error);
      setErrorMessage("送信に失敗しました。インターネット接続を確認して、もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-800 font-sans pb-10">
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <h1 className="font-black text-sm tracking-tighter">Memory Studio</h1>
        </div>
        <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
          {step < 4 ? `STEP ${step} / 3` : 'COMPLETE'}
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 py-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black">ご購入ありがとうございます！</h2>
              <p className="text-xs text-gray-500">制作に必要な情報を入力してください</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div>
                <label className="text-[10px] font-black text-pink-500 uppercase mb-1 block tracking-wider">注文番号</label>
                <input type="text" placeholder="メールに記載のご注文番号を入力"
                  className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-pink-200 outline-none text-sm font-bold"
                  value={formData.orderNumber}
                  onChange={e => setFormData({...formData, orderNumber: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-pink-500 uppercase mb-1 block tracking-wider">飼い主様のお名前</label>
                <input type="text" placeholder="お名前を入力"
                  className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-pink-200 outline-none text-sm font-bold"
                  value={formData.ownerName}
                  onChange={e => setFormData({...formData, ownerName: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-pink-500 uppercase mb-1 block tracking-wider">ペットのお名前</label>
                <input type="text" placeholder="ペットのお名前を入力"
                  className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-pink-200 outline-none text-sm font-bold"
                  value={formData.petName}
                  onChange={e => setFormData({...formData, petName: e.target.value})} />
              </div>
            </div>
            <button onClick={() => setStep(2)}
              disabled={!formData.orderNumber || !formData.ownerName || !formData.petName}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-30 shadow-xl">
              次へ進む <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black">お写真のアップロード</h2>
              <p className="text-[10px] text-gray-400">あなたの最愛の家族を最高の着せかえに！</p>
            </div>

            <div className="bg-pink-50 p-6 rounded-[2.5rem] border border-pink-100 space-y-4">
              <h3 className="text-xs font-black text-pink-600 flex items-center gap-2">
                <Eye className="w-4 h-4" /> 制作例イメージ
              </h3>
              <div className="flex bg-white/50 p-1 rounded-full border border-pink-100">
                {[['bg','背景'],['pass','パスコード'],['menu','メニュー・アイコン']].map(([key, label]) => (
                  <button key={key} onClick={() => setActiveSample(key)}
                    className={`flex-1 text-[10px] py-1.5 rounded-full font-bold transition-all ${activeSample === key ? 'bg-pink-500 text-white shadow-sm' : 'text-pink-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="aspect-[9/16] w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white">
                <img src={samples[activeSample]} alt="制作例" className="w-full h-full object-contain" />
              </div>
              <p className="text-[10px] text-pink-500 text-center font-bold px-2 leading-relaxed">
                {activeSample === 'bg' && "お送りいただいた写真を元に、足あとや配置を可愛くデザインします！"}
                {activeSample === 'pass' && "数字を入力する際に、表情が切り替わる楽しい演出です！"}
                {activeSample === 'menu' && "メニューボタンやアイコンにもペットが！毎日開くのが楽しくなります。"}
              </p>
            </div>

            <ImageUploadSlot id="main" label="トーク背景" description="トーク画面やホームの背景。一番好きな写真を1枚選んでください！"
              preview={formData.images.main} onUpload={handleUpload} isRequired={true} />

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Smartphone className="w-4 h-4 text-pink-500" />
                <h3 className="font-black text-sm text-gray-700">パスコード用 (4枚)</h3>
              </div>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                正面を向いた綺麗な写真を送っていただければ、お顔だけを切り取ってサンプルのように可愛く作成します！
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map(n => (
                  <ImageUploadSlot key={n} id={`pass${n}`} label="" description=""
                    preview={formData.images[`pass${n}`]} onUpload={handleUpload} />
                ))}
              </div>
              <p className="text-[9px] text-gray-400 text-center italic">数字を押した後の表情になります</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-2">
                <Grid className="w-4 h-4 text-pink-500" />
                <h3 className="font-black text-sm text-gray-700">メニューとアイコン用</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ImageUploadSlot id="iconIndividual" label="アイコン (個人用)" description="プロフィール等のアイコン"
                  preview={formData.images.iconIndividual} onUpload={handleUpload} />
                <ImageUploadSlot id="iconGroup" label="アイコン (グループ用)" description="グループトークのアイコン"
                  preview={formData.images.iconGroup} onUpload={handleUpload} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {menuLabels.map((label, index) => (
                  <ImageUploadSlot key={index} id={`menu${index + 1}`} label={label} description=""
                    preview={formData.images[`menu${index + 1}`]} onUpload={handleUpload} />
                ))}
              </div>
              <p className="text-[9px] text-gray-400 text-center italic">※写真は使い回しOKです！</p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-4 bg-gray-50 rounded-2xl flex gap-3 border border-gray-100">
                <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                  できるだけ体や耳が切れていない、ピントの合った綺麗なお写真をお送りいただくと、よりクオリティの高い仕上がりになります！
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-4 font-bold text-gray-400">戻る</button>
                <button onClick={() => setStep(3)} disabled={!formData.images.main}
                  className="flex-[2] bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg disabled:opacity-30">
                  確認画面へ <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black">送信内容の確認</h2>
              <p className="text-xs text-gray-500">内容に間違いがなければ送信してください</p>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">注文番号</p>
                  <p className="font-bold text-sm">{formData.orderNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">飼い主様のお名前</p>
                  <p className="font-bold text-sm">{formData.ownerName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">ペットのお名前</p>
                  <p className="font-bold text-sm">{formData.petName}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">アップロード済み</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(formData.images).map(([key, src]) => (
                    <div key={key} className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border">
                      <img src={src} className="w-full h-full object-cover" alt="thumb" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-bold">{errorMessage}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-4 font-bold text-gray-400">戻る</button>
              <button onClick={submitForm} disabled={isSubmitting}
                className="flex-[2] bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> 送信中...</> : <>写真を提出する <Send className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-10 space-y-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black">送信完了しました！</h2>
              <p className="text-xs text-gray-500 leading-relaxed px-6">
                お写真を受け取りました。これからあなたの最愛の家族に合わせた最高の着せかえを制作いたします！
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm w-full">
              <p className="text-[10px] text-gray-400 uppercase font-black mb-1">受付番号</p>
              <p className="text-lg font-mono font-bold text-slate-700">{receiptNumber}</p>
            </div>
            <button onClick={() => window.location.reload()}
              className="text-pink-500 font-bold text-sm border-b-2 border-pink-500 pb-1">
              TOPに戻る
            </button>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6">
        <a href="#" className="w-12 h-12 bg-[#06C755] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
          <MessageCircle className="w-6 h-6" />
        </a>
      </div>
    </div>
  );
};

export default App;
