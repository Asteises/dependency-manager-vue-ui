<template>
  <main class="auth">
    <div class="auth__card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div class="auth__logo">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#4f8cf7"/>
              <stop offset="1" stop-color="#2f67f0"/>
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#g)"/>
          <path d="M18 30l-4-4 4-4M30 18l4 4-4 4M23 19l2 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </div>

      <h1 id="auth-title" class="auth__title">Dependency Manager</h1>

      <form class="auth__form" @submit.prevent="onSubmit" novalidate>
        <div class="field">
          <label for="email">Email</label>
          <input
              id="email"
              type="email"
              v-model.trim="email"
              @input="emailDirty = true"
              @blur="emailTouched = true"
              :class="{ invalid: showEmailError }"
          />
          <p v-if="emailTouched && !emailValid" class="field__error">Введите корректный email.</p>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <div class="password">
            <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model.trim="password"
                @input="passwordDirty = true"
                @blur="passwordTouched = true"
                :class="{ invalid: showPasswordError }"
            />
            <button
                type="button"
                class="password__toggle"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                    d="M12 5c5.523 0 9.75 4.5 9.75 7s-4.227 7-9.75 7-9.75-4.5-9.75-7 4.227-7 9.75-7Zm0 3.5A3.5 3.5 0 1 0 12 15a3.5 3.5 0 0 0 0-7Z"
                    fill="currentColor"/>
              </svg>
            </button>
          </div>
          <p v-if="passwordTouched && !passwordValid" class="field__error">
            Минимум 8 символов.
          </p>
        </div>

        <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

        <button
            class="primary-btn"
            :disabled="!formValid || loading"
            :aria-busy="loading ? 'true' : 'false'"
        >
          <span v-if="!loading">{{ isSignIn ? 'Sign In' : 'Sign Up' }}</span>
          <span v-else>Processing…</span>
        </button>
      </form>

      <div class="auth__switch">
        <span>{{ isSignIn ? 'Need an account?' : 'Already have an account?' }}</span>
        <button class="link" type="button" @click="toggleMode" :disabled="loading">
          {{ isSignIn ? 'Sign up' : 'Sign in' }}
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/service/auth'

const router = useRouter()

const state = reactive({
  mode: 'signin' as 'signin' | 'signup',
})

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const emailTouched = ref(false)
const passwordTouched = ref(false)

const submitted = ref(false)
const emailDirty = ref(false)
const passwordDirty = ref(false)

const isSignIn = computed(() => state.mode === 'signin')

const emailValid = computed(() =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
)

const showEmailError = computed(
    () => !emailValid.value && ((emailTouched.value && emailDirty.value) || submitted.value)
)
const showPasswordError = computed(
    () => !passwordValid.value && ((passwordTouched.value && passwordDirty.value) || submitted.value)
)

const passwordValid = computed(() => password.value.length >= 8)

const formValid = computed(() => emailValid.value && passwordValid.value)

function toggleMode() {
  state.mode = isSignIn.value ? 'signup' : 'signin'
  errorMessage.value = null
}

async function onSubmit() {
  submitted.value = true
  emailTouched.value = true
  passwordTouched.value = true
  if (!formValid.value || loading.value) return

  emailTouched.value = true
  passwordTouched.value = true
  if (!formValid.value || loading.value) return
  loading.value = true
  errorMessage.value = null

  try {
    if (isSignIn.value) {
      const res = await authApi.signIn(email.value, password.value)
      if (res) {
        console.log('Access approve')
        console.log('token: ', res.token)
        console.log('user: ', res.user)
      }
      localStorage.setItem('dm_token', res.token)
      await router.push({ name: 'home' })
    } else {
      const res = await authApi.signUp(email.value, password.value)
      localStorage.setItem('dm_token', res.token)
      await router.push({ name: 'home' })
    }
  } catch (e: any) {
    errorMessage.value =
        'Authentication failed. Please check your data and try again.'
    await router.push({ name: 'home' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background:
      radial-gradient(1200px 600px at 80% -10%, rgba(79, 140, 247, 0.20), transparent 60%),
      radial-gradient(1000px 500px at -10% 110%, rgba(47, 103, 240, 0.18), transparent 60%),
      #f6f8fc;
  padding: 24px;
}

.auth__card {
  width: 100%;
  max-width: 380px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.14);
  border: 1px solid rgba(2, 6, 23, 0.08);
  padding: 32px 36px 28px;
  position: relative;
  background-clip: padding-box;
}

.auth__form { gap: 16px; }

.auth__logo {
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}
.auth__logo svg {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 10px 20px rgba(47, 103, 240, 0.30));
  border-radius: 12px;
}

.auth__title {
  margin: 8px 0 12px;
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #1049d1;
}

.field label {
  display: block;
  font-size: 0.9rem;
  color: #0f172a;
  margin-bottom: 6px;
}

.field input {
  box-sizing: border-box;
  width: 100%;
  font: inherit;
  padding: 5px 7px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.18);
  background: #fff;
  transition: border-color 120ms ease, box-shadow 120ms ease;
  outline: none;
}

.field input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35);
}

.field input.invalid { border-color: #dc2626; }

.field__error { color: #dc2626; font-size: 0.85rem; margin-top: 6px; }

.password {
  position: relative;
}

.password input { padding-right: 44px; }

.password__toggle {
  position: absolute;
  right: 10px; top: 50%; transform: translateY(-50%);
  height: 28px; width: 28px;
  border-radius: 8px; border: none; background: transparent;
  color: #64748b; cursor: pointer;
}

.password__toggle:hover { color: #334155; }

.primary-btn {
  width: 380px;
  margin-top: 8px;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(180deg, #2f67f0, #2857cc);
  border: none;
  box-shadow: 0 8px 18px rgba(47, 103, 240, 0.30);
  transition: transform 80ms ease, filter 120ms ease, box-shadow 120ms ease;
}

.primary-btn:disabled { filter: grayscale(.25) brightness(.97); box-shadow: none; }

.primary-btn:not(:disabled):active {
  transform: translateY(1px);
}

.form-error {
  margin: 4px 0 -4px;
  color: #dc2626;
  text-align: center;
}

.auth__switch {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  color: #64748b;
  font-size: 0.95rem;
}
button.link {
  background: none;
  border: none;
  color: #2f67f0;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
button.link:hover { text-decoration: underline; }
</style>
