# WindBorne Vendor Dashboard

A comprehensive financial analysis dashboard for vendor comparison and risk assessment. Track and analyze key suppliers with real-time financial data from Alpha Vantage API.

## 🎯 Overview

This dashboard provides WindBorne with intelligent vendor analysis across **5 key suppliers**:
- **TE Connectivity (TEL)** - Sensor Supplier
- **Sensata Technologies (ST)** - Sensor Supplier  
- **DuPont de Nemours (DD)** - Materials Supplier
- **Celanese Corporation (CE)** - Materials Supplier
- **LyondellBasell Industries (LYB)** - Materials Supplier

## ✨ Features

### **Real-Time Financial Data**
- Live market data from Alpha Vantage API
- Comprehensive financial metrics (revenue, profit margins, P/E ratios)
- Balance sheet analysis and financial ratios
- 52-week price ranges and market volatility

### **Smart Risk Assessment**
- Multi-factor risk scoring (Financial Health, Market Stability, Growth Prospects, Financial Stability)
- Dynamic risk classification (Low/Medium/High)
- Automated risk threshold analysis

### **Strategic Insights**
- Data-driven vendor recommendations
- Portfolio concentration risk analysis
- Liquidity and debt monitoring alerts
- Growth prospect evaluation

### **Interactive Dashboard**
- Vendor comparison tables with sorting and filtering
- Financial analysis charts and visualizations
- Detailed vendor modal views
- CSV export functionality

## 🛠 Tech Stack

### **Backend (Python/FastAPI)**
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM with caching
- **Alpha Vantage API** - Real-time financial data
- **SQLite** - Local database for caching
- **Pandas** - Data processing and analysis

### **Frontend (React/TypeScript)**
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Financial data visualization
- **Lucide Icons** - Modern icon library

## 🚀 Quick Start

### **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

### **Environment Variables**
Copy `backend/.env.example` to `backend/.env` and add your Alpha Vantage API key:
```bash
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

## 📊 API Endpoints

- `GET /api/vendors` - List all tracked vendors with financial data
- `GET /api/vendors/{symbol}` - Detailed vendor information
- `GET /api/portfolio/kpis` - Portfolio-level KPI metrics
- `GET /api/export/csv` - Export vendor data to CSV
- `GET /api/cache/status` - Cache performance metrics

## 🔒 Security Features

- Environment variables for API keys
- CORS configuration for production
- Input validation and error handling
- Rate limiting for external API calls
- Secure data caching with expiration

## 📈 Data Sources

- **Alpha Vantage API** - Real-time financial and market data
- **Company Overview** - Market cap, P/E ratios, financial ratios
- **Income Statements** - Revenue, profit margins, quarterly data
- **Balance Sheets** - Assets, liabilities, cash positions

## 🎨 Dashboard Sections

1. **KPI Overview** - Portfolio-wide financial metrics
2. **Vendor Comparison** - Side-by-side financial analysis
3. **Risk Analysis** - Multi-factor risk assessment
4. **Financial Charts** - Visual data representation
5. **Strategic Recommendations** - Automated insights and alerts

## 🚢 Deployment

This application is deployed using:
- **Backend**: Render (Python hosting)
- **Frontend**: Vercel (React hosting)
- **Database**: SQLite with 24-hour caching

### **Production URLs**
- Frontend: `https://windborne-dashboard.vercel.app`
- Backend API: `https://windborne-backend.onrender.com`

## 📝 License

Private repository for WindBorne Systems vendor analysis.

---

**Built for WindBorne Systems** - Intelligent vendor risk analysis and financial monitoring.