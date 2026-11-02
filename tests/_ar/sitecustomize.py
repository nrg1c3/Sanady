# The app picks its language from the phone; the tests check the Arabic screens, so every test browser is an Arabic phone
# unless the test asks for another language.
try:
    from playwright.sync_api._generated import Browser as SB
    from playwright.async_api._generated import Browser as AB
    for B in (SB, AB):
        for name in ('new_context', 'new_page'):
            orig = getattr(B, name)
            def wrap(orig):
                def f(self, *a, **k):
                    k.setdefault('locale', 'ar-EG')
                    return orig(self, *a, **k)
                return f
            setattr(B, name, wrap(orig))
except Exception:
    pass
