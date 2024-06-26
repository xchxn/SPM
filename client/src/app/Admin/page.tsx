"use client";
import styles from "./adminStyles.module.scss";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Image from "next/image";
interface OptionField {
  관리구분: string[];
  품목: string[];
  품종: string[];
}

interface SelectedItems {
  관리구분: Set<string>;
  품목: Set<string>;
  품종: Set<string>;
}

interface ProductDetails {
  관리구분: string;
  품목: string;
  품종: string;
  등급: string;
  기준수량: number;
  기준중량: number;
  NotiSet: boolean;
}
interface ProductsState {
  products: ProductDetails[];
}

async function getOptionField(): Promise<any> {
  const token = Cookies.get("token");
  const requestOptions: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 3600 },
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/getOptionField`,
    requestOptions
  );

  if (!response.ok) {
    if (response.status === 401) {
      window.alert("인증에 실패하였습니다. 로그인 후 진행해 주세요.");
      throw new Error("Token authentication failed. Please log in again.");
    } else throw new Error("Failed to fetch data");
  }
  return response.json();
}

async function getAdminOptions(params: SelectedItems): Promise<any> {
  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      관리구분: Array.from(params.관리구분),
      품목: Array.from(params.품목),
      품종: Array.from(params.품종),
    }),
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/getAdminOptions`,
    requestOptions
  );

  if (!response.ok) {
    if (response.status === 401) {
      window.alert("권한이 없습니다. 관리자로 로그인 해주세요.");
      throw new Error("Token authentication failed. Please log in again.");
    } else {
      window.alert("필터 조건을 1체크해주세요.");
      throw new Error("Failed to fetch data");
    }
  }
  return response.json();
}

async function setAdminOptions(params: any): Promise<void> {
  const token = Cookies.get("token");
  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
    next: { revalidate: 3600 },
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/setAdminOptions`,
    requestOptions
  );

  if (!response.ok) {
    throw new Error("Failed to set data");
  } else {
    window.alert("업데이트 완료.");
  }

  return response.json();
}

async function makeForecast(): Promise<any> {
  const requestOptions: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 36000 },
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/forecast/makeNoti`,
    requestOptions
  );

  if (!response.ok) {
    throw new Error("Failed to fetch data");
  } else {
    window.alert("예측 데이터 생성 완료.");
  }
  return response.json();
}

export default function Page() {
  const [field, setField] = useState({
    관리구분: [],
    품목: [],
    품종: [],
  });
  const [selected, setSelected] = useState<SelectedItems>({
    관리구분: new Set<string>(),
    품목: new Set<string>(),
    품종: new Set<string>(),
  });
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getOptionField();
        setField(data);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleCheckboxChange = (
    category: keyof SelectedItems,
    item: string
  ) => {
    setSelected((prev) => {
      const updatedSelection = new Set(prev[category]);
      if (updatedSelection.has(item)) {
        updatedSelection.delete(item);
      } else {
        updatedSelection.add(item);
      }
      return {
        ...prev,
        [category]: updatedSelection,
      };
    });
  };

  const handleClick = async () => {
    const getOptions = await getAdminOptions(selected);
    const optionData: ProductDetails[] = getOptions;
    setProducts(optionData);
  };

  const handleUpdate = async () => {
    setAdminOptions(products);
  };

  const handleForecast = async () => {
    await makeForecast();
  };

  const handleProductChange = (
    index: number,
    field: keyof ProductDetails,
    value: string
  ) => {
    const updatedProducts = products.map((product, idx) => {
      if (idx === index) {
        return { ...product, [field]: parseFloat(value) || 0 };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  const handleNotiChange = (
    index: number,
    field: keyof ProductDetails,
    checked: boolean
  ) => {
    const updatedProducts = products.map((product, idx) => {
      if (idx === index) {
        return { ...product, [field]: checked };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  if (isLoading) {
    return (
      <div>
        <Image
          src={"/loading.svg"} // public 폴더 내의 경로
          alt="설명"
          width={66} // 이미지의 폭
          height={66} // 이미지의 높이
          layout="fixed" // 레이아웃 옵션: fixed, intrinsic, responsive, fill 등
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.optionField}>
        <strong>관리구분</strong>
        <div className={styles.fieldOptions}>
          {field.관리구분.map((item, index) => (
            <div key={index}>
              <input
                type="checkbox"
                checked={selected.관리구분.has(item)}
                onChange={() => handleCheckboxChange("관리구분", item)}
              />
              <p>{item}</p>
            </div>
          ))}
        </div>
        <strong>품목</strong>
        <div className={styles.fieldOptions}>
          {field.품목.map((item, index) => (
            <div key={index}>
              <input
                type="checkbox"
                checked={selected.품목.has(item)}
                onChange={() => handleCheckboxChange("품목", item)}
              />
              <p>{item}</p>
            </div>
          ))}
        </div>
        <strong>품종</strong>
        <div className={styles.fieldOptions}>
          {field.품종.map((item, index) => (
            <div key={index}>
              <input
                type="checkbox"
                checked={selected.품종.has(item)}
                onChange={() => handleCheckboxChange("품종", item)}
              />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleClick} type="button">
        검색하기
      </button>
      <div className={styles.selectedItems}>
        {products.map((product: any, index) => (
          <li key={index}>
            <div>
              <strong>관리구분:</strong> {product.관리구분}
              <strong> 품목:</strong> {product.품목}
              <strong> 품종:</strong> {product.품종}
              <strong> 등급:</strong> {product.등급}
            </div>
            <div>
              <input
                type="number"
                value={product.기준수량}
                onChange={(e) =>
                  handleProductChange(index, "기준수량", e.target.value)
                }
              />
              <input
                type="number"
                value={product.기준중량}
                onChange={(e) =>
                  handleProductChange(index, "기준중량", e.target.value)
                }
              />
              <input
                type="checkbox"
                checked={product.NotiSet}
                onChange={(e) =>
                  handleNotiChange(index, "NotiSet", e.target.checked)
                }
              />
              <label>알림설정</label>
            </div>
          </li>
        ))}
      </div>
      <button onClick={handleUpdate} type="button">
        업데이트
      </button>
      <button onClick={handleForecast} type="button">
        예측 결과 생성하기
      </button>
    </div>
  );
}
