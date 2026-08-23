# Healtly-life

Premium tibbiy bronlash platformasi. Loyihada foydalanuvchi, doktor, dorixona, shifoxona va admin oqimlari, Firebase asosidagi bronlash, shifokor boshqaruvi va premium UI mavjud.

## Ishga tushirish

```bash
npm install
npm run dev
```

AI yordamchi uchun `.env.local` ichiga server tomondagi kalitni kiriting:

```env
GROQ_API_KEY=gsk_your_key
# Ixtiyoriy: loyihada tekshirilgan standart model ishlatiladi.
GROQ_CHAT_MODEL=openai/gpt-oss-20b
```

Vercel deploy uchun shu qiymatlarni Project Settings -> Environment Variables bo'limiga qo'shing. `GROQ_API_KEY` ni `VITE_` prefiksi bilan bermang: kalit faqat serverda qolishi kerak.
