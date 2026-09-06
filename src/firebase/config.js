import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCUOKpRvjBVKRTcQf22RumR3dRQ50cmj3E",
  authDomain: "lang-a63d8.firebaseapp.com",
  projectId: "lang-a63d8",
  storageBucket: "lang-a63d8.firebasestorage.app",
  messagingSenderId: "602890728960",
  appId: "1:602890728960:web:5fc2654afb2bb09cfbcae5",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export default app
