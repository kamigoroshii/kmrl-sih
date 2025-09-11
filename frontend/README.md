# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# KMRL Document Workflow Management System - Frontend

This is the React frontend for the Kochi Metro Rail Limited (KMRL) Document Workflow Management System. The application provides a comprehensive interface for managing documents across different departments with role-based access control.

## Features

### 🏠 Public Homepage
- Hero section with KMRL overview (mission, vision, achievements)
- Metro statistics dashboard (ridership, route length, stations)
- Department overview with interactive cards
- Responsive design for all devices

### 🔐 Authentication System
- Role-based login (Admin & Department Heads)
- Secure JWT-based authentication
- Protected routes with automatic redirection
- Session management

### 👥 User Roles

#### Admin Dashboard
- View all department documents
- Approve/reject document submissions
- Generate comprehensive reports
- Analytics and trends visualization
- Department-wise filtering
- Real-time statistics

#### Department Head Dashboard
- Upload department-specific documents
- Track document approval status
- View uploaded documents history
- Receive notifications for status updates
- Document categorization

### 📄 Document Management
- **File Upload**: Support for PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF
- **File Size Limit**: Up to 10MB per document
- **Categories**: Department-specific categories (drawings, reports, invoices, etc.)
- **Status Tracking**: Pending, Approved, Rejected, Under Review
- **Search & Filter**: Advanced filtering by status, category, date
- **Preview & Download**: Direct document preview and download

### 🏢 Department-Specific Features
- **Engineering**: Drawings, technical reports, specifications
- **Maintenance**: Job cards, incident logs, maintenance reports
- **Procurement**: Invoices, purchase orders, vendor documents
- **Finance**: Budget statements, expense reports, financial statements
- **HR**: Policies, training materials, employee records
- **Safety**: Safety circulars, compliance checks, incident reports
- **Legal**: Contracts, legal memos, agreements
- **Board**: Meeting minutes, presentations, strategic documents

### 📊 Analytics & Reporting
- Upload trends visualization
- Department-wise statistics
- Approval rate metrics
- Custom report generation
- Interactive charts using Recharts

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with custom KMRL theme
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **State Management**: React Context API

## Project Structure

```
src/
├── api/
│   └── axios.ts              # API configuration and interceptors
├── components/
│   ├── AdminDashboard.tsx    # Admin dashboard with analytics
│   ├── DepartmentDashboard.tsx # Department head dashboard
│   ├── DocumentList.tsx      # Document listing with filters
│   ├── Footer.tsx           # Footer component
│   ├── HomePage.tsx         # Public homepage
│   ├── Login.tsx            # Authentication form
│   ├── Navbar.tsx           # Navigation bar
│   ├── ProtectedRoute.tsx   # Route protection HOC
│   └── UploadForm.tsx       # Document upload form
├── context/
│   └── AuthContext.tsx      # Authentication context
├── App.tsx                  # Main app component with routing
├── main.tsx                 # App entry point
└── index.css               # Global styles with Tailwind
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Flask backend running on `http://localhost:5000`

### Steps

1. **Install Dependencies**
   ```bash
   cd kmrl-frontend
   npm install
   ```

2. **Configure Environment**
   Update the API base URL in `src/api/axios.ts` if your Flask backend runs on a different port:
   ```typescript
   baseURL: 'http://localhost:5000/api', // Update this URL
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## API Integration

The frontend integrates with your existing Flask backend using the following endpoints:

### Authentication
- `POST /api/login` - User authentication
- Token-based authentication with automatic refresh

### Document Management
- `GET /api/documents` - Fetch all documents (admin)
- `GET /api/documents?department=xyz` - Fetch department documents
- `POST /api/upload` - Upload new document
- `POST /api/documents/{id}/approve` - Approve document
- `POST /api/documents/{id}/reject` - Reject document

### Dashboard & Analytics
- `GET /api/dashboard/admin` - Admin dashboard stats
- `GET /api/dashboard/department/{dept}` - Department stats
- `GET /api/dashboard/trends` - Upload trends data
- `GET /api/notifications` - User notifications

### Reports
- `GET /api/reports/summary` - Generate PDF reports

## Demo Credentials

### Admin Login
- **Username**: `admin`
- **Password**: `admin123`

### Department Head Login
- **Username**: `eng_head` (Engineering Department)
- **Password**: `password123`

## Commands to Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

**Note**: This frontend is designed to work with your existing Flask backend. Ensure your backend implements the required API endpoints for full functionality.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
