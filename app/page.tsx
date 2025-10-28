export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center p-5">
      <div className="max-w-md w-full">
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">バーコードスキャナー</h1>
          <p className="text-lg opacity-90">クラウド対応システム</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-4">
          <a
            href="/scanner"
            className="block w-full bg-green-500 hover:bg-green-600 text-white text-center font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            スキャン開始
          </a>

          <a
            href="/dashboard"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            ダッシュボード
          </a>

          <div className="text-center text-sm text-gray-600 mt-6">
            <p>スマホでバーコードをスキャンして</p>
            <p>クラウドに自動保存</p>
          </div>
        </div>
      </div>
    </div>
  );
}
