import React, { useState, useEffect } from 'react';
import { generateImpactMessage } from './services/geminiService';
import { generateCertificatePDF } from './utils/pdfUtils';
import { IPInfo, UserStats } from './types';

const App: React.FC = () => {
  const [name, setName] = useState('');
  const [ip, setIp] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchIpAndCheckLimit = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data: IPInfo = await res.json();
        setIp(data.ip);

        // Check local storage for this IP (Simulating server-side IP tracking)
        const storageKey = `cert_stats_${data.ip}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const stats: UserStats = JSON.parse(stored);
          setCount(stats.count);
        }
      } catch (err) {
        console.error("IP check failed", err);
        // Fallback to a generic key if IP fetching fails
        const stored = localStorage.getItem('cert_stats_generic');
        if (stored) {
          const stats: UserStats = JSON.parse(stored);
          setCount(stats.count);
        }
      }
    };

    fetchIpAndCheckLimit();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (count >= 2) {
      setError('Üzgünüz, bu cihazdan maksimum 2 sertifika oluşturma limitine ulaştınız.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const impact = await generateImpactMessage(name);
      const date = new Date().toLocaleDateString('tr-TR');
      
      await generateCertificatePDF({
        name,
        date,
        impactMessage: impact
      });

      // Update state and storage
      const newCount = count + 1;
      setCount(newCount);
      const storageKey = ip ? `cert_stats_${ip}` : 'cert_stats_generic';
      const stats: UserStats = {
        count: newCount,
        lastGenerated: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(stats));
      
      setIsSuccess(true);
      setName('');
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      setError('Sertifika PDF dosyası oluşturulurken bir hata oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const limitReached = count >= 2;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50">
      {/* Header Section */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 mb-4 bg-cyan-100 rounded-full text-cyan-700">
          <i className="fas fa-microscope text-2xl"></i>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 serif">
          Bilimsel Gönüllü Portalı
        </h1>
        <p className="text-slate-600 text-lg">
          Değerli vaktinizi bilim için harcadığınız için teşekkür ederiz.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-cyan-900 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Sertifika Oluştur</h2>
            <p className="text-cyan-200 text-sm">Katılım belgenizi anında indirin.</p>
          </div>
          <div className="text-right">
            <span className="block text-xs uppercase tracking-wider text-cyan-300">Kalan Hak</span>
            <span className="text-2xl font-bold">{Math.max(0, 2 - count)}</span>
          </div>
        </div>

        <div className="p-8">
          {limitReached ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <i className="fas fa-exclamation-triangle text-amber-500 text-3xl mb-3"></i>
              <h3 className="text-amber-900 font-semibold text-lg mb-2">Limit Aşıldı</h3>
              <p className="text-amber-700">
                Bu IP adresi üzerinden belirlenen maksimum 2 sertifika alma limitine ulaştınız. Teşekkür ederiz.
              </p>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Tam Adınız ve Soyadınız
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <i className="fas fa-user"></i>
                  </span>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Örn: Dr. Ahmet Yılmaz"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all disabled:bg-slate-50"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                  <i className="fas fa-circle-exclamation"></i>
                  {error}
                </div>
              )}

              {isSuccess && (
                <div className="text-green-700 text-sm flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-100">
                  <i className="fas fa-check-circle"></i>
                  Sertifikanız başarıyla oluşturuldu ve indirildi!
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-cyan-900 hover:bg-cyan-950 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-cyan-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-pdf"></i>
                    Sertifikayı İndir
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Nasıl Çalışır?
            </h4>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-slate-500">
                <span className="flex-shrink-0 w-5 h-5 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Adınızı girin ve "İndir" butonuna tıklayın.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-500">
                <span className="flex-shrink-0 w-5 h-5 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Yapay zeka, size özel bir teşekkür mesajı oluşturacaktır.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-500">
                <span className="flex-shrink-0 w-5 h-5 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>PDF sertifikanız otomatik olarak tarayıcınıza inecektir.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} Bilimsel Araştırma Platformu</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="#" className="hover:text-cyan-600 transition-colors">Gizlilik Politikası</a>
          <span>•</span>
          <a href="#" className="hover:text-cyan-600 transition-colors">İletişim</a>
        </div>
      </footer>
    </div>
  );
};

export default App;