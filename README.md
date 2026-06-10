# QFlow - Hostel Queue Management System

## Overview
QFlow is a modern, premium web application designed to manage washroom and washing machine queues in a hostel environment. It features real-time updates via WebSockets, a stunning glassmorphism UI, and AI-style visual aesthetics.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Axios, React Router, Socket.io-client
- **Backend**: Node.js, Express, MySQL, Socket.io, JWT Authentication

## Setup Instructions

### 1. Database Setup
1. Ensure MySQL is installed and running on your machine.
2. Log into MySQL and run the SQL script provided in `backend/qflow_schema.sql` to create the database, tables, and seed data.
```bash
mysql -u root -p < backend/qflow_schema.sql
```
*Note: The script creates an admin user `admin@qflow.com` with password `admin123`.*

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder.
2. Install dependencies:
```bash
cd backend
npm install
```
3. Create a `.env` file (one is already generated) with your MySQL credentials.
4. Start the backend server:
```bash
npm run dev
```
*The server will start on http://localhost:5000*

### 3. Frontend Setup
1. Open another terminal and navigate to the `frontend` folder.
2. Install dependencies:
```bash
cd frontend
npm install
```
3. Start the Vite development server:
```bash
npm run dev
```
*The app will open on http://localhost:5173*

## Features Implemented
- Authentication (Login/Register with JWT)
- Student Dashboard with real-time queue status
- Floor and Washroom selection UI
- Real-time Washroom queue joining/leaving (Socket.io synced)
- Real-time Washing machine queue joining/leaving
- Beautiful glassmorphism, animated UI with modern gradients
- Admin Dashboard (Metrics and management pages)
