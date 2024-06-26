'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import styles from './loginStyles.module.scss'
async function Login(formData: any) {
  const rawFormData = {
    id: formData.get('id'),
    password: formData.get('password'),
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rawFormData),
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, requestOptions);
  const data = await res.json();
  console.log(data);
  // 사용자가 존재하는 경우
  if (data) {
    // 토큰 정보 저장
    Cookies.set('id', data.id, { expires: 6000 });
    Cookies.set('token', data.token, { expires: 6000 });
    console.log('로그인 성공.');
    window.alert("로그인 성공, 홈으로 돌아갑니다.");
    return true;
  } else {
    // 사용자가 존재하지 않는 경우
    console.log('로그인 실패.');
    window.alert("로그인 실패, 올바른 정보를 입력해주세요.");
    return false;
  }
}

export default function Page() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    id: '',
    password: '',
  });

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const success = await Login(new FormData(e.target));
    if (success) {
      router.push('/');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>SPM 로그인</div>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              id="id"
              name="id"
              placeholder="@ID"
              value={formData.id}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="@PASSWORD"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <button className={styles.button} type="submit">
              Login
            </button>
            <button className={styles.button} type="button">
              <Link href="/SignUp">Sign Up</Link>
            </button>
          </div>
          <div>
            If you dont have an id, sign up
          </div>
        </form>
    </div>
  );
}
