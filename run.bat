@echo off
title SmartSort Commerce Engine Runner
echo ===================================================
echo Starting Merge Sort E-Commerce Visualizer
echo ===================================================

cd /d "C:\Users\dyuth\OneDrive\Desktop\merge-sort-ecommerce"

echo Opening browser at http://localhost:5173
start http://localhost:5173

echo Starting Vite server
npm run dev