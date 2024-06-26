"use client";
import { useState, useEffect } from "react";
import forecastStyles from "./forecastStyles.module.scss";
import Image from "next/image";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale);

interface InventoryItem {
  관리구분: string;
  품목: string;
  품종: string;
  등급: string;
  예측날짜: string;
  예측고: number;
  예측중량: number;
  재고상태: string;
  중량상태: string;
}
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill: boolean;
    borderColor: string;
    tension: number;
    yAxisID: string;
  }[];
}

// groupedInventory 객체의 타입을 명시합니다.
interface GroupedInventory {
  [key: string]: InventoryItem[];
}

interface ChartDataAndOptions {
  data: ChartData;
  options: any;
}

//옵션을 선택된 항목들의 예측값 요청
async function getForecast(options: any) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/forecast/data`,
    requestOptions
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
}

//DB에서 항목을 구별할 수 있는 옵션 요청
async function getOptions(option: any) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(option),
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/forecast/getOptions`,
    requestOptions
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
}

//anomaly값이 있는 항목 전부 요청
async function getAll() {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/forecast/getAnomalyItems`,
    requestOptions
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
}
export default function Page() {
  const [inventory, setInventory] = useState<[]>([]);
  const [groupedInventory, setGroupedInventory] = useState<GroupedInventory>(
    {}
  );
  const [options, setOptions] = useState({
    관리구분: "",
    품목: "",
    품종: "",
    등급: "",
  });
  const [initialState, setInitialState] = useState({
    관리구분: [],
    품목: [],
    품종: [],
    등급: [],
  });

  //차트 옵션
  const [chartData, setChartData] = useState<{ [key: string]: ChartData }>({});
  const [chartDataAndOptions, setChartDataAndOptions] = useState<
    Record<string, { data: ChartData; options: any }>
  >({});
  const [viewOption, setViewOption] = useState("chart");

  // Inventory 데이터를 그룹화하는 함수
  const groupInventory = (inventory: InventoryItem[]) => {
    const grouped: { [key: string]: InventoryItem[] } = {};

    inventory.forEach((item) => {
      const key = `${item.관리구분}-${item.품목}-${item.품종}-${item.등급}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  //옵션으로 보여질 데이터 설정
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getForecast(options);
        setInventory(data);
        const groupedData = groupInventory(data);
        setGroupedInventory(groupedData);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };
    fetchData();
  }, [options, options.등급]);

  //옵션 상태 설정
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOptions(options);
        setInitialState((prevStates) => ({
          관리구분: data.관리구분 || prevStates.관리구분,
          품목: data.품목 || prevStates.품목,
          품종: data.품종 || prevStates.품종,
          등급: data.등급 || prevStates.등급,
        }));
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchData();
  }, [options]);

  const handleSelectChange = async (event: any) => {
    const { name, value } = event.target;

    if (name === "관리구분") {
      // '관리구분'이 변경될 경우, 나머지 상태를 초기화합니다.
      setOptions({
        관리구분: value,
        품목: "",
        품종: "",
        등급: "",
      });
      setInitialState({
        관리구분: initialState.관리구분, // 관리구분 리스트는 유지
        품목: [],
        품종: [],
        등급: [],
      });
    } else if (name === "품목") {
      setOptions({
        관리구분: options.관리구분,
        품목: value,
        품종: "",
        등급: "",
      });
      setInitialState({
        관리구분: initialState.관리구분, // 관리구분 리스트는 유지
        품목: initialState.품목,
        품종: [],
        등급: [],
      });
    } else if (name === "품종") {
      setOptions({
        관리구분: options.관리구분,
        품목: options.품목,
        품종: value,
        등급: "",
      });
      setInitialState({
        관리구분: initialState.관리구분, // 관리구분 리스트는 유지
        품목: initialState.품목,
        품종: initialState.품종,
        등급: [],
      });
    } else {
      setOptions((prevOptions) => ({
        ...prevOptions,
        [name]: value, // 특정 키(예: 관리구분)의 값을 업데이트
      }));
    }
    console.log(options);
  };

  //전부 가져오기 버튼 동작
  const handleClick = async () => {
    const values = await getAll();
    setInventory(values);
    console.log(inventory);
    const groupedData = groupInventory(values);
    setGroupedInventory(groupedData);
    console.log(groupInventory);
  };

  const generateChartDataAndOptions = (items: InventoryItem[]) => {
    const stock_min = Math.min(...items.map((item) => item.예측고)) / 100;
    const stock_max = Math.max(...items.map((item) => item.예측고)) / 100;
    const weight_min = Math.min(...items.map((item) => item.예측중량)) / 100;
    const weight_max = Math.max(...items.map((item) => item.예측중량)) / 100;
    const options = {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Line Chart Example" },
      },
      scales: {
        x: { type: "category", labels: items.map((item) => item.예측날짜) },
        y: {
          type: "linear",
          min: stock_min - 1,
          max: stock_max + 1,
          position: "left",
        },
        y1: {
          type: "linear",
          min: weight_min - 1,
          max: weight_max + 1,
          position: "right",
        }, // 여백을 추가하여 차트가 더욱 깔끔하게 보이도록 함
      },
      // grid line settings
      grid: {
        drawOnChartArea: false, // only want the grid lines for one axis to show up
      },
    };
    const chartData = {
      labels: items.map((item) => item.예측날짜),
      datasets: [
        {
          label: "예측고",
          data: items.map((item) => item.예측고 / 100),
          borderColor: "rgb(255, 99, 132)",
          pointStyle: items.map((item) => item.재고상태 === 'O' ? 'circle' : 'crossRot'),
          pointRadius: 10,
          pointHoverRadius: 15,
          tension: 0.4,
          fill: false,
          yAxisID: "y",
        },
        {
          label: "예측중량",
          data: items.map((item) => item.예측중량 / 100),
          borderColor: "rgb(54, 162, 235)",
          pointStyle:  items.map((item) => item.중량상태 === 'O' ? 'circle' : 'crossRot'),
          pointRadius: 10,
          pointHoverRadius: 15,
          tension: 0.1,
          fill: false,
          yAxisID: "y1",
        },
      ],
    };
    return { data: chartData, options };
  };

  const handleViewChange = (event: any) => {
    setViewOption(event.target.value);
  };

  useEffect(() => {
    if (Object.keys(groupedInventory).length > 0) {
      // 초기값에 타입을 명시적으로 지정
      const newChartDataAndOptions = Object.keys(groupedInventory).reduce<
        Record<string, ChartDataAndOptions>
      >((acc, groupKey) => {
        const items = groupedInventory[groupKey];
        acc[groupKey] = generateChartDataAndOptions(items);
        return acc;
      }, {});
      setChartDataAndOptions(newChartDataAndOptions);
    }
  }, [groupedInventory]);

  return (
    <div className={forecastStyles.aaacontainer}>
      <div className={forecastStyles.optionContainer}>
        <select
          id="관리구분"
          name="관리구분"
          value={options.관리구분}
          onChange={handleSelectChange}
        >
          <option value="" disabled={options.품목 === ""}>
            선택하세요
          </option>
          {initialState.관리구분.map((option: any, index: any) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          id="품목"
          name="품목"
          value={options.품목}
          onChange={handleSelectChange}
        >
          <option value="" disabled={options.품목 === ""}>
            선택하세요
          </option>
          {initialState.품목.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          id="품종"
          name="품종"
          value={options.품종}
          onChange={handleSelectChange}
        >
          <option value="" disabled={options.품목 === ""}>
            선택하세요
          </option>
          {initialState.품종.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          id="등급"
          name="등급"
          value={options.등급}
          onChange={handleSelectChange}
        >
          <option value="" disabled={options.품목 === ""}>
            선택하세요
          </option>
          {initialState.등급.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleClick} type="button">
        전부 가져오기
      </button>
      <div className={forecastStyles.subContainer}>
        <label>
          <input
            type="radio"
            name="viewOption"
            value="chart"
            onChange={handleViewChange}
            checked={viewOption === "chart"}
          />
          <span> 차트로 보기</span>
        </label>
        <label>
          <input
            type="radio"
            name="viewOption"
            value="numeric"
            onChange={handleViewChange}
            checked={viewOption === "numeric"}
          />
          <span> 수치로 보기</span>
        </label>
      </div>
      <div className={forecastStyles.itemsContainer}>
        {viewOption === "chart" ? (
          <div className={forecastStyles.chartContainer}>
            {Object.entries(chartDataAndOptions).map(
              ([groupKey, { data, options }]) => (
                <div key={groupKey}>
                  <h3>{groupKey.replace(/-/g, " : ")}</h3>
                  <Line data={data} options={options} />
                </div>
              )
            )}
          </div>
        ) : (
          <div className={forecastStyles.numericContainer}>
            {Object.keys(groupedInventory).map((groupKey, index) => (
              <div key={index}>
                <h3>{groupKey.replace(/-/g, " : ")}</h3>
                <ul>
                  <li>
                    <p>예측고</p>
                    <p>예측중량</p>
                    <p>날짜</p>
                  </li>
                  {groupedInventory[groupKey].map((item: any, idx: any) => (
                    <li key={idx}>
                      {item.재고상태 === "X" ? (
                        <strong>{item.예측고} </strong>
                      ) : (
                        <p> {item.예측고} </p>
                      )}
                      {item.중량상태 === "X" ? (
                        <strong>{item.예측중량} </strong>
                      ) : (
                        <p> {item.예측중량} </p>
                      )}
                      <p>{item.예측날짜}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div />
          </div>
        )}
      </div>
    </div>
  );
}
