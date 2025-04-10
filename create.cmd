# Initialize the frontend with Vue + Vite
yarn create vite frontend --template vue
cd frontend
yarn install

# Add frontend dependencies
yarn add mapbox-gl vue-router pinia axios jwt-decode
yarn add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Create backend directory and initialize
cd ..
mkdir backend
cd backend
yarn init -y
yarn add express cors dotenv jsonwebtoken bcryptjs sqlite3 body-parser

# Create project basic structure
mkdir -p frontend/src/components
mkdir -p frontend/src/views
mkdir -p frontend/src/stores
mkdir -p frontend/src/assets
mkdir -p backend/routes
mkdir -p backend/controllers
mkdir -p backend/models
mkdir -p backend/middleware