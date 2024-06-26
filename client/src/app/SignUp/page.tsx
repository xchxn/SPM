'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './signupStyles.module.scss'

async function signUp(formData: FormData): Promise<any> {
  const rawFormData = {
    id: formData.get("id"),
    password: formData.get("password"),
    passwordCheck: formData.get("passwordCheck"),
    name: formData.get("name"),
  };
  if (!(rawFormData.password === rawFormData.passwordCheck)) {
    window.alert("비밀번호가 같지 않습니다.");
    return false;
  }
  console.log(rawFormData);

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rawFormData),
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, requestOptions);

  if (!res.ok) {
    throw new Error("fail fetch data");
  }

  console.log("회원가입 성공");
  window.alert("회원가입 성공, 로그인 해주세요");
  return true;
}

async function IdCheck(targetId: string): Promise<boolean> {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: targetId }),
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/idvalidcheck`, requestOptions);
  const data = await res.json();

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  if (data) {
    window.alert("동일한 아이디가 존재합니다.");
    return false;
  }

  console.log("사용가능한 아이디입니다.");
  window.alert("사용가능한 아이디입니다.");
  return true;
}

export default function Page() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    id: '',
    idDupCheck: false,
    name: '',
    password: '',
    passwordCheck: '',
  });

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const success = await signUp(new FormData(e.target));
    if (success) {
      router.push('/Login');
    }
  };

  const handleIdCheck = async (e: any) => {
    e.preventDefault();
    if (await IdCheck(formData.id)) {
      setFormData({...formData, idDupCheck: true});
    } else {
      setFormData({...formData, idDupCheck:false})
    }
  };

  return (
      <div className={styles.container}>
        <div className={styles.title}>SPM 회원가입</div>
          <form onSubmit={handleSubmit}>
            <div className={formData.idDupCheck ? styles.inputValid : ''}>
              <input
                type="text"
                id="id"
                name="id"
                placeholder="사용할 아이디"
                value={formData.id}
                onChange={handleChange}
              />
              <button
                className={styles.dupButton}
                id="idDupCheck"
                onClick={handleIdCheck}
                >  
                Check for duplication
              </button>
            </div>
            <div>
              <input
                type="name"
                id="name"
                name="name"
                placeholder="사용할 이름"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div className={(formData.passwordCheck !== "" && formData.password === formData.passwordCheck) ? styles.inputValid : ''}>
              <input
                type="password"
                id="passwordCheck"
                name="passwordCheck"
                placeholder="비밀번호 확인"
                value={formData.passwordCheck}
                onChange={handleChange}
              />
            </div>
            <div>
              <button
                className={styles.button}
                id="signUp"
                type="submit">
                Sign up
              </button>
            </div>
          </form>
      </div>
  );
}
