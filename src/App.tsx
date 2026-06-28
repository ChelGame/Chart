import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- ВАЛИДАЦИЯ ZOD ---
const DataPointSchema = z.object({
    date: z.string().min(1, { message: 'Дата обязательна' }),
    cost: z.coerce.number().min(0, { message: 'Расход >= 0' }),
    cpa: z.coerce.number().min(0, { message: 'CPA >= 0' }),
    roi: z.coerce.number(),
    conversions: z.coerce.number().min(0, { message: 'Конверсии >= 0' }),
});

type DataPoint = z.infer<typeof DataPointSchema>;

// --- МОКОВЫЙ МАССИВ (все даты в формате dd.mm.yyyy) ---
const MOCK_DATA: DataPoint[] = [
    { date: '01.06.2026', cost: 10, cpa: 2.1, roi: 70, conversions: 12 },
    { date: '08.06.2026', cost: 20, cpa: 1.5, roi: 40, conversions: 18 },
    { date: '12.06.2026', cost: 44.36, cpa: 1.23, roi: 161.47, conversions: 36 },
    { date: '20.06.2026', cost: 30, cpa: 1.9, roi: 15, conversions: 25 },
    { date: '26.06.2026', cost: 45, cpa: 1.7, roi: 80, conversions: 35 },
];

// --- КАСТОМНЫЙ ТУЛТИП (с колбэком) ---
const CustomTooltip = ({ active, payload, label, onActiveIndexChange, dataPoints }: any) => {
    if (active && payload && payload.length) {
        const index = dataPoints.findIndex((item: DataPoint) => item.date === label);
        if (index !== -1) {
            onActiveIndexChange(index);
        }
        const colors = ['#fdd835', '#2196f3', '#4caf50', '#9c27b0'];
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 min-w-[140px] z-50 text-sm">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 mb-1 text-gray-700">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                        <span className="font-semibold">{entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    onActiveIndexChange(null);
    return null;
};

// --- КАСТОМНЫЕ ТОЧКИ ---

// Жёлтая точка (Cost) – скрыта по умолчанию, появляется при наведении
const YellowActiveDot = ({ cx, cy, index, activeIndex }: any) => {
    const isActive = activeIndex === index;
    return (
        <g style={{
            transform: `scale(${isActive ? 1.5 : 0})`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
            opacity: isActive ? 1 : 0
        }}>
            <circle cx={cx} cy={cy} r={16} fill="rgba(253, 216, 53, 0.25)" stroke="none" />
            <circle cx={cx} cy={cy} r={6} fill="#fdd835" />
        </g>
    );
};

// Зелёная точка (ROI) – скрыта по умолчанию, появляется при наведении
const GreenActiveDot = ({ cx, cy, index, activeIndex }: any) => {
    const isActive = activeIndex === index;
    return (
        <g style={{
            transform: `scale(${isActive ? 1.5 : 0})`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
            opacity: isActive ? 1 : 0
        }}>
            <circle cx={cx} cy={cy} r={16} fill="rgba(76, 175, 80, 0.25)" stroke="none" />
            <polygon points={`${cx},${cy-6} ${cx+6},${cy} ${cx},${cy+6} ${cx-6},${cy}`} fill="#4caf50" />
        </g>
    );
};

// Фиолетовая точка (Conversions) – всегда виден квадрат, при наведении появляется ареол и квадрат уменьшается
const PurpleActiveDot = ({ cx, cy, index, activeIndex }: any) => {
    const isActive = activeIndex === index;
    return (
        <g>
            <circle
                cx={cx}
                cy={cy}
                r={16}
                fill="rgba(156, 39, 176, 0.25)"
                stroke="none"
                style={{
                    transform: `scale(${isActive ? 1.5 : 0})`,
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
                    opacity: isActive ? 1 : 0
                }}
            />
            <rect
                x={cx-5}
                y={cy-5}
                width={10}
                height={10}
                fill="#9c27b0"
                style={{
                    transform: `scale(${isActive ? 0.7 : 1})`,
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            />
        </g>
    );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
function App() {
    const [dataPoints, setDataPoints] = useState<DataPoint[]>(MOCK_DATA);
    const [isChartHover, setIsChartHover] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<DataPoint>({
        resolver: zodResolver(DataPointSchema) as any,
        defaultValues: { date: '', cost: 0, cpa: 0, roi: 0, conversions: 0 }
    });

    const onSubmit = (data: DataPoint) => {
        setDataPoints((prev) => [...prev, data]);
        reset();
    };

    const handleTooltipIndexChange = (index: number | null) => {
        setActiveIndex(index);
    };

    const roiStrokeWidth = activeIndex !== null ? 2 : 4;

    return (
        <div className="min-h-screen bg-[#fce4ec] p-6 md:p-8 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden p-6 md:p-8">
                <h1 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">Аналитика по 4-м параметрам</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Дата</label>
                        <input {...register('date')} placeholder="12.06.2026" className={`w-full p-2 border rounded bg-gray-50 ${errors.date ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cost</label>
                        <input {...register('cost')} type="number" step="0.01" className="w-full p-2 border rounded bg-gray-50 border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CPA</label>
                        <input {...register('cpa')} type="number" step="0.01" className="w-full p-2 border rounded bg-gray-50 border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">ROI</label>
                        <input {...register('roi')} type="number" step="0.01" className="w-full p-2 border rounded bg-gray-50 border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Conversions</label>
                        <input {...register('conversions')} type="number" className="w-full p-2 border rounded bg-gray-50 border-gray-300" />
                    </div>
                    <button type="submit" className="col-span-2 md:col-span-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Добавить</button>
                </form>

                <div
                    className="w-full flex flex-row h-[350px] md:h-[400px] border border-gray-200 rounded-md overflow-hidden transition-colors duration-300 ease-in-out"
                    style={{ backgroundColor: isChartHover ? '#fce4ec' : '#fef6f8' }}
                    onMouseEnter={() => setIsChartHover(true)}
                    onMouseLeave={() => {
                        setIsChartHover(false);
                        setActiveIndex(null);
                    }}
                >
                    <div className="w-16 flex-shrink-0 flex flex-col text-[12px] text-gray-800">
                        <div className="flex-1 flex items-center justify-center font-bold bg-white">Tdy</div>
                        <div className="flex-1 flex items-center justify-center even:bg-white">0%</div>
                        <div className="flex-1 flex items-center justify-center even:bg-white">$0</div>
                        <div className="flex-1 flex items-center justify-center even:bg-white">$0</div>
                        <div className="flex-1 flex items-center justify-center even:bg-white">0</div>
                        <div className="flex-1 flex items-center justify-center even:bg-white">0</div>
                        <div className="flex-1 flex items-center justify-center even:bg-white">—</div>
                    </div>

                    <div className="flex-1 relative">
                        <div className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded shadow-sm cursor-pointer hover:bg-gray-100 flex items-center justify-center z-20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={dataPoints}
                                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                            >
                                <CartesianGrid horizontal={true} vertical={false} syncWithTicks={true} stroke="#d1d5db" strokeDasharray="3 3" />

                                <XAxis dataKey="date" tick={false} axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }} tickLine={false} />
                                <YAxis yAxisId="left" domain={[0, 100]} tick={false} axisLine={false} tickCount={7} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 200]} tick={false} axisLine={false} tickCount={7} />

                                <Tooltip
                                    content={<CustomTooltip
                                        onActiveIndexChange={handleTooltipIndexChange}
                                        dataPoints={dataPoints}
                                    />}
                                    cursor={{ stroke: '#9ca3af', strokeWidth: 1 }}
                                />

                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="cost"
                                    stroke="#fdd835"
                                    strokeWidth={2}
                                    fill="#fdd835"
                                    fillOpacity={0.4}
                                    activeDot={false}
                                    dot={(props) => <YellowActiveDot {...props} activeIndex={activeIndex} />}
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="cpa"
                                    barSize={16}
                                    fill="#2196f3"
                                    activeBar={{ fill: 'rgba(33, 150, 243, 0.5)' }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="roi"
                                    stroke="#4caf50"
                                    strokeWidth={roiStrokeWidth}
                                    activeDot={false}
                                    dot={(props) => <GreenActiveDot {...props} activeIndex={activeIndex} />}
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="conversions"
                                    stroke="#9c27b0"
                                    strokeWidth={2}
                                    activeDot={false}
                                    dot={(props) => <PurpleActiveDot {...props} activeIndex={activeIndex} />}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;