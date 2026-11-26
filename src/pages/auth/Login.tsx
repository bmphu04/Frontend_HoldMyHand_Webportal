import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { notify } from '@/lib/toast'
import { ArrowLeft, User, KeyRound, Mail, Eye, EyeOff, Gamepad2, X, Scan, Type, Sliders, Circle } from 'lucide-react'

interface AuthProps {
  initialMode?: 'login' | 'register'
}

export default function Login({ initialMode }: AuthProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isLoading, error, clearError } = useAuthStore()

  // Determine active mode based on props or current path
  const [mode, setMode] = useState<'login' | 'register'>(() => {
    if (initialMode) return initialMode
    if (location.pathname === '/register') return 'register'
    return 'login'
  })

  // Synchronize mode if URL or prop changes
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode)
    } else if (location.pathname === '/register') {
      setMode('register')
    } else if (location.pathname === '/login') {
      setMode('login')
    }
  }, [location.pathname, initialMode])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/register') {
        setMode('register')
      } else if (window.location.pathname === '/login') {
        setMode('login')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const switchMode = (newMode: 'login' | 'register') => {
    clearError()
    setMode(newMode)
    if (newMode === 'register') {
      window.history.pushState(null, '', '/register')
    } else {
      window.history.pushState(null, '', '/login')
    }
  }

  // Login form state (keeping original login form completely intact)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register form state (matching the screenshot)
  const [regDisplayName, setRegDisplayName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)

  // Floating Particles Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Animated Floating Ember Particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Particle pool
    const numParticles = 45
    const particles: Array<{
      x: number
      y: number
      size: number
      speedY: number
      speedX: number
      opacity: number
      pulseSpeed: number
    }> = []

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1,
        speedY: Math.random() * 0.6 + 0.2,
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p) => {
        p.y -= p.speedY
        p.x += p.speedX
        p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.01

        if (p.y < -10) {
          p.y = height + 10
          p.x = Math.random() * width
        }
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245, 158, 11, ${Math.max(0.1, Math.min(0.9, p.opacity))})`
        ctx.shadowBlur = 8
        ctx.shadowColor = '#f59e0b'
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Handle Login Submit (original behavior)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      const user = await login({ username: email, password })
      notify.success(`Chào mừng ${user.displayName || user.username}!`, 'Đăng nhập thành công')
      if (user.role === 'Admin') navigate('/admin')
      else if (user.role === 'Moderator') navigate('/moderator')
      else navigate('/portal/lobby')
    } catch (err: any) {
      const message =
        err.response?.status === 401
          ? 'Tên đăng nhập hoặc mật khẩu không chính xác'
          : err.response?.data?.message || err.response?.data || 'Đăng nhập thất bại'
      notify.error(typeof message === 'string' ? message : 'Đăng nhập thất bại', 'Đăng nhập thất bại')
    }
  }

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!regDisplayName.trim()) {
      notify.error('Vui lòng nhập tên hiển thị trong game')
      return
    }
    if (!regUsername.trim()) {
      notify.error('Vui lòng nhập tên đăng nhập')
      return
    }
    if (!regEmail.trim()) {
      notify.error('Vui lòng nhập email')
      return
    }
    if (regPassword !== regConfirmPassword) {
      notify.error('Mật khẩu xác nhận không khớp')
      return
    }
    if (regPassword.length < 6) {
      notify.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    try {
      await register({
        displayName: regDisplayName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
      })
      notify.success('Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.', 'Thành công')
      setEmail(regUsername.trim())
      setPassword(regPassword)
      switchMode('login')
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data || 'Đăng ký thất bại'
      notify.error(typeof message === 'string' ? message : 'Đăng ký thất bại', 'Vui lòng thử lại')
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-[#06080e] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 flex flex-col justify-between">
      {/* Background Gothic Castle Artwork & Animated Zoom */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45 animate-pulse"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop)',
            animationDuration: '14s',
          }}
        />
        {/* Dark Vignette & Mood Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080e] via-[#06080e]/50 to-[#06080e]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080e]/95 via-transparent to-[#06080e]/95" />

        {/* Pulsing Warm Torch Glow Blobs */}
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-amber-500/15 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute top-1/3 right-1/3 w-96 h-96 bg-orange-600/10 rounded-full blur-[140px] animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Floating Animated Ember Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-8 md:px-12 lg:px-16 py-6 flex items-center justify-between">
        {/* Top-Left Logo matching screenshot */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-widest text-white leading-none uppercase">
              HOLD MY HAND
            </span>
            <span className="font-mono text-[9px] text-slate-500 tracking-wider block mt-1 uppercase">
              GAME PORTAL · CO-OP
            </span>
          </div>
        </Link>

        {/* Top-Right Navigation Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Trang chủ
        </Link>
      </header>

      {/* Main Content Split View matching screenshot */}
      <main className="relative z-20 w-full px-8 md:px-12 lg:px-16 py-6 sm:py-8 flex-1 flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-12">
        {/* Left Side Showcase Text */}
        <div className="max-w-xl space-y-6">
          {/* Tagline Badge matching screenshot */}
          <div className="inline-flex items-center gap-3">
            <span className="text-[12px] font-bold text-yellow-400 tracking-[0.2em] uppercase font-sans">
              — CÙNG NHAU THÚ VỊ HƠN.
            </span>
          </div>

          {/* Main Huge Title */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[96px] font-black text-white tracking-tight leading-[1.04] font-sans antialiased">
            HOLD
            <br />
            MY HAND<span className="text-yellow-400 font-black">.</span>
          </h1>

          {/* Yellow Accent Line */}
          <div className="h-1 w-16 bg-yellow-400 rounded-full" />

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal max-w-md">
            Một người bạn. Một cuộc phiêu lưu.
            <br />
            Vô vàn thế giới đang chờ bạn.
          </p>
        </div>

        {/* Right Side Glassmorphic Floating Entry / Register Box with smooth layout animation */}
        <motion.div
          layout
          transition={{
            layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          }}
          className="w-full max-w-[440px] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-7 sm:p-9 shadow-2xl relative overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'login' ? (
              /* ================= LOGIN VIEW (ENTIRELY PRESERVED AS ORIGINAL) ================= */
              <motion.div
                key="login-view"
                initial={{ opacity: 0, x: -16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -16, filter: 'blur(4px)' }}
                transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Header inside Entry Box */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest block font-mono">
                      PORTAL ACCESS
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 block mt-1">
                      22 : HMH-092-01
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="w-8 h-8 rounded-md border border-white/10 bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Title inside Box */}
                <h2 className="text-4xl md:text-[44px] font-black text-white tracking-tight mt-8 mb-8 leading-none font-sans uppercase">
                  ENTRY
                  <br />
                  POINT
                </h2>

                {/* Original Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium text-center">
                      {error}
                    </div>
                  )}

                  {/* Field 1: Username / Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                      TÊN ĐĂNG NHẬP / EMAIL
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="USER_LOGIN_TOKEN"
                      className="w-full px-4 py-3.5 bg-[#0b0e17]/90 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-600 font-mono focus:border-yellow-400/80 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Field 2: Password */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                        KHÓA BẢO MẬT
                      </label>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3.5 bg-[#0b0e17]/90 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-600 font-mono focus:border-yellow-400/80 focus:outline-none transition-colors pr-16"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-xs font-bold text-slate-400 hover:text-white tracking-wider cursor-pointer font-mono"
                      >
                        {showPassword ? 'ẨN' : 'HIỆN'}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-white hover:bg-slate-100 text-slate-950 font-black text-sm tracking-wider uppercase rounded-lg shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? 'ĐANG XÁC NHẬN...' : 'XÁC NHẬN TRUY CẬP'}
                  </button>
                </form>

                {/* Bottom Actions inside Box */}
                <div className="flex items-center pt-6 mt-6 border-t border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer font-mono"
                  >
                    TẠO TÀI KHOẢN
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ================= REGISTER VIEW (Exact match to screenshot) ================= */
              <motion.div
                key="register-view"
                initial={{ opacity: 0, x: 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 16, filter: 'blur(4px)' }}
                transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Header inside Register Box */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest block font-mono">
                      PORTAL ACCESS
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                      22 : HMH-092-01
                    </span>
                  </div>
                  {/* Step Counter matching screenshot */}
                  <span className="font-mono text-xs font-semibold text-slate-400 tracking-wider">
                    02 / 02
                  </span>
                </div>

                {/* Title inside Box */}
                <h2 className="text-3xl sm:text-4xl md:text-[40px] font-black text-white tracking-tight mt-6 mb-1 leading-[1.05] font-sans uppercase">
                  CREATE
                  <br />
                  ACCOUNT
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-5 block">
                  TẠO HỒ SƠ PHIÊU LƯU CỦA BẠN
                </span>

                {/* Register Form */}
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {/* 1. Tên hiển thị */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      TÊN HIỂN THỊ
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        placeholder="Tên bạn trong game"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e17]/90 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder:text-slate-600 font-mono focus:border-yellow-400/80 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* 2. Tên đăng nhập */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      TÊN ĐĂNG NHẬP
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Tên đăng nhập"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e17]/90 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder:text-slate-600 font-mono focus:border-yellow-400/80 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* 3. Email */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      EMAIL
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e17]/90 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder:text-slate-600 font-mono focus:border-yellow-400/80 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* 4. Mật khẩu */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      MẬT KHẨU
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Tạo mật khẩu"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#0b0e17]/90 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder:text-slate-600 font-mono focus:border-yellow-400/80 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        aria-label="Hiện/Ẩn mật khẩu"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 5. Xác nhận mật khẩu */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      XÁC NHẬN MẬT KHẨU
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#0b0e17]/90 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder:text-slate-600 font-mono focus:border-yellow-400/80 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        aria-label="Hiện/Ẩn mật khẩu xác nhận"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Register Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase rounded-lg shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer mt-3"
                  >
                    {isLoading ? 'ĐANG TẠO HỒ SƠ...' : 'TẠO TÀI KHOẢN'}
                  </button>
                </form>

                {/* Bottom Actions inside Register Box matching screenshot */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs">
                  <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                    ĐÃ CÓ TÀI KHOẢN?
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-mono text-[11px] font-bold text-white hover:text-yellow-400 uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>ĐĂNG NHẬP</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Bottom Status Bar matching screenshot */}
      <footer className="relative z-20 w-full px-8 md:px-12 lg:px-16 py-6 border-t border-white/5 text-[11px] font-bold text-slate-500 uppercase tracking-widest flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>HOLD MY HAND · GAME PORTAL CO-OP</span>
        <div className="hidden sm:flex items-center gap-3.5 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-slate-400">
          <Scan className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
          <Type className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
          <Sliders className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
          <Circle className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
        </div>
        <span>HAI NGƯỜI, MỘT CUỘC HÀNH TRÌNH.</span>
      </footer>
    </div>
  )
}
