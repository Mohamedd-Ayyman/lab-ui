<div align="center">

# 🫀 Blood Pressure Monitor: Testing Lab UI

**An interactive blood-pressure classifier built with Next.js for a Software Testing lab.**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=black)

</div>

---

## 📖 Overview

Enter systolic and diastolic readings and the app classifies them using the standard clinical categories, with colour-coded feedback. The app was built as the system under test for a **Software Testing** course lab, so its categories have clear boundary values that are well suited to boundary-value and equivalence-partition test design.

## ✨ Features

- 🩺 Classifies readings as **Hypotension · Normal · Elevated · Stage 1 Hypertension · Stage 2 Hypertension · Hypertensive Crisis**
- 🎨 Colour-coded results
- ✍️ GSAP **typewriter animation** for the header
- 📱 Responsive Tailwind UI

## 🧪 Testing focus

| Category | Systolic | Diastolic |
|---|---|---|
| Normal | < 120 | < 80 |
| Elevated | 120–129 | < 80 |
| Stage 1 | 130–139 | 80–89 |
| Stage 2 | ≥ 140 | ≥ 90 |

These thresholds give the boundary values the lab's test cases are built around.

## 🚀 Getting Started

```bash
git clone https://github.com/Mohamedd-Ayyman/lab-ui.git
cd lab-ui
npm install
npm run dev     # http://localhost:3000
```

## 👤 Author

**Mohamed Ayman**, Frontend / Full-Stack Developer · [GitHub](https://github.com/Mohamedd-Ayyman) · [LinkedIn](https://linkedin.com/in/mohamed-ayman-8787b0269)
