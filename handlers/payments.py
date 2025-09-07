from aiogram import Router, types, F
from aiogram.types import LabeledPrice, PreCheckoutQuery, Message
from database import set_subscription
from config import SUB_NO_AI_STARS, SUB_AI_STARS

router = Router()

@router.message(F.text == "💎 اشتراک‌ها")
async def show_plans(message: types.Message):
    kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text=f"✨ بدون AI – {SUB_NO_AI_STARS}⭐️", callback_data="buy:noai")],
        [types.InlineKeyboardButton(text=f"🤖 با AI – {SUB_AI_STARS}⭐️", callback_data="buy:ai")]
    ])
    await message.answer("پلن‌تو انتخاب کن:", reply_markup=kb)

@router.callback_query(F.data.startswith("buy:"))
async def buy_cb(call: types.CallbackQuery):
    kind = call.data.split(":")[1]
    amount = SUB_AI_STARS if kind == "ai" else SUB_NO_AI_STARS
    await call.message.bot.send_invoice(
        chat_id=call.from_user.id,
        title=f"اشتراک ماهانه ({'AI' if kind=='ai' else 'Basic'})",
        description="دسترسی ۳۰ روزه",
        payload=f"sub:{kind}",
        provider_token="",      # Stars
        currency="XTR",
        prices=[LabeledPrice(label="یک‌ماهه", amount=amount)],
    )
    await call.answer()

@router.pre_checkout_query()
async def pre_checkout(pre: PreCheckoutQuery):
    await pre.bot.answer_pre_checkout_query(pre.id, ok=True)

@router.message(F.successful_payment)
async def on_success(message: Message):
    payload = message.successful_payment.invoice_payload or "sub:noai"
    kind = payload.split(":")[1]
    set_subscription(message.from_user.id, ai=(kind == "ai"))
    await message.answer("✅ اشتراک فعال شد.")