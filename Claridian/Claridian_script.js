document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const suspiciousnessSlider = document.getElementById('suspiciousness');
    const coherenceSlider = document.getElementById('coherence');
    const sleepSlider = document.getElementById('sleep'); 
    const suspValSpan = document.getElementById('susp-val');
    const cohValSpan = document.getElementById('coh-val');
    const sleepValSpan = document.getElementById('sleep-val'); 
    const socialWithdrawalSlider = document.getElementById('social_withdrawal');
    const attentionSlider = document.getElementById('attention');
    const functioningSlider = document.getElementById('functioning');
    const withdrawalValSpan = document.getElementById('withdrawal-val');
    const attentionValSpan = document.getElementById('attention-val');
    const functioningValSpan = document.getElementById('functioning-val');
    
    // UI/Tab Elements
    const methodSliderBtn = document.getElementById('method-slider');
    const methodTextBtn = document.getElementById('method-text');
    const sliderInputArea = document.getElementById('slider-input-area');
    const textInputArea = document.getElementById('text-input-area');
    const inputPanelCore = document.getElementById('input-panel-core');
    const inputPanelExtended = document.getElementById('input-panel-extended');
    const prevTabBtn = document.getElementById('prev-tab-btn');
    const nextTabBtn = document.getElementById('next-tab-btn');
    const tabTitle = document.getElementById('tab-title');
    const gifElement = document.getElementById('gif');
    const assessButton = document.getElementById('assess-btn'); 
    const analyzeTextButton = document.getElementById('analyze-text-btn'); 
    const triggeredRulesList = document.getElementById('triggered-rules-list');
    const actionPlanTextElement = document.getElementById('action-plan-text');
    const timelineItemsContainer = document.getElementById('timeline-items-container');
    const timeAxis = document.getElementById('time-axis');
    
    // Date/Report Elements
    const healthPlanDateSpan = document.getElementById('health-plan-date');
    const reportLink = document.getElementById('report-link'); 
    const mainContent = document.getElementById('main-content');
    
    let assessmentRun = false; // Global state tracker

    // --- Configuration ---
    const API_URL = 'http://127.0.0.1:5000/api/assess_risk';
    
    // CSS Variables for ECharts
    const highRiskColor = getComputedStyle(document.documentElement).getPropertyValue('--color-risk-high').trim();
    const moderateRiskColor = getComputedStyle(document.documentElement).getPropertyValue('--color-risk-moderate').trim();
    const lowRiskColor = getComputedStyle(document.documentElement).getPropertyValue('--color-risk-low').trim();
    const primary700 = getComputedStyle(document.documentElement).getPropertyValue('--primary-700').trim(); 
    const text1 = getComputedStyle(document.documentElement).getPropertyValue('--neutral-100').trim(); 
    const primary300 = getComputedStyle(document.documentElement).getPropertyValue('--primary-300').trim(); 
    let currentPanel = 1; 

    // --- FUNCTION: Get Current Date/Time (REAL TIME) ---
    function getCurrentDateFormatted() {
        const now = new Date(); 
        
        const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        // Format is HH:MM AM/PM
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        
        const dateString = now.toLocaleDateString('en-US', dateOptions); 
        const timeString = now.toLocaleTimeString('en-US', timeOptions);

        
        return `${dateString} - ${timeString}`;
    }
    
    // --- FUNCTION: Update Date/Time in Health Plan ---
    function updateDateTime() {
        healthPlanDateSpan.textContent = getCurrentDateFormatted(); 
    }

    // Set the initial date and update it every minute for real-time accuracy
    updateDateTime();
    setInterval(updateDateTime, 60000); 

    // --- ECHARTS INITIALIZATION & CONFIGURATION ---
    const chartDom = document.getElementById('risk-chart-container');
    const riskChart = echarts.init(chartDom, 'transparent'); 
    let gaugeOption = {
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                center: ['50%', '80%'],
                radius: '150%',
                min: 0,
                max: 100,
                axisLine: { lineStyle: { width: 15, color: [ [1, primary700] ], shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
                progress: { show: true, roundCap: true, width: 15, itemStyle: { color: primary300 } },
                pointer: { show: false }, 
                axisLabel: { distance: 10, formatter: (value) => { return (value === 0 || value === 100) ? value + '%' : ''; }, fontSize: 0, color: text1 },
                title: { offsetCenter: [0, '-40%'], fontSize: 16, color: primary300, fontWeight: 'bold' },
                detail: {
                    fontSize: 35, offsetCenter: [0, '-10%'], valueAnimation: true,
                    formatter: function (value) { return Math.round(value) + '%'; },
                    color: primary300
                },
                data: [ { value: 0, name: 'Awaiting Input' } ]
            }
        ]
    };
    riskChart.setOption(gaugeOption);

    // --- UI/Tab Logic ---
    function updateTabDisplay() {
        // First, ensure all panels are hidden
        inputPanelCore.classList.add('hidden');
        inputPanelExtended.classList.add('hidden');
        
        // Then, show the active panel and update navigation state
        if (currentPanel === 1) {
            inputPanelCore.classList.remove('hidden');
            tabTitle.textContent = 'Core Metrics (1/2)';
            prevTabBtn.disabled = true;
            nextTabBtn.disabled = false;
        } else if (currentPanel === 2) {
            inputPanelExtended.classList.remove('hidden');
            tabTitle.textContent = 'Extended Metrics (2/2)';
            prevTabBtn.disabled = false;
            nextTabBtn.disabled = true;
        }
    }
    updateTabDisplay(); 
    
    
    prevTabBtn.addEventListener('click', () => {
        if (currentPanel > 1) {
            currentPanel--;
            updateTabDisplay();
        }
    });

    nextTabBtn.addEventListener('click', () => {
        if (currentPanel < 2) {
            currentPanel++;
            updateTabDisplay();
        }
    });


    function setActiveMethod(method) {
        gifElement.classList.add('hidden');
        if (method === 'slider') {
            sliderInputArea.classList.remove('hidden');
            textInputArea.classList.add('hidden');
            methodSliderBtn.classList.replace('btn-secondary', 'btn-primary');
            methodTextBtn.classList.replace('btn-primary', 'btn-secondary');
        } else if (method === 'text') {
            textInputArea.classList.remove('hidden');
            sliderInputArea.classList.add('hidden');
            methodTextBtn.classList.replace('btn-secondary', 'btn-primary');
            methodSliderBtn.classList.replace('btn-primary', 'btn-secondary');
        }
    }

    
    function updateRangeProgress(slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const value = parseFloat(slider.value);
        const percentage = ((value - min) / (max - min)) * 100;
        slider.style.setProperty('--range-progress', `${percentage}%`);
    }

    // --- FUNCTION: Handle TO MOCK TXT ---
    function generateReport() {
        if (!assessmentRun) {
            alert("⚠️ Please run an assessment before generating a report.");
            return;
        }

        const riskLevel = reportLink.dataset.riskLevel || 'Unknown';
        const riskScore = reportLink.dataset.riskScore || '50';
        
        // --- MOCK TEXT DOWNLOAD REVERTED ---
        const reportContent = `CLARIDIAN Psychosis Risk Assessment Report\n\nDate: ${getCurrentDateFormatted()}\nRisk Score: ${riskScore}%\nRisk Level: ${riskLevel}\n\nThis is a mock analysis report. The assessment summary is provided above.`;

        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `CLARIDIAN_Report_${riskLevel}_${new Date().toISOString().slice(0, 10)}.txt`; 
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(` ${riskLevel} Risk Report downloaded successfully as a text file.`);
    }
    
    // --- Event Listeners ---
    methodSliderBtn.addEventListener('click', () => setActiveMethod('slider'));
    methodTextBtn.addEventListener('click', () => setActiveMethod('text'));
    reportLink.addEventListener('click', generateReport); 
    
    // Slider Event Listeners
    suspiciousnessSlider.addEventListener('input', () => { suspValSpan.textContent = suspiciousnessSlider.value; updateRangeProgress(suspiciousnessSlider); });
    coherenceSlider.addEventListener('input', () => { cohValSpan.textContent = coherenceSlider.value; updateRangeProgress(coherenceSlider); });
    sleepSlider.addEventListener('input', () => { sleepValSpan.textContent = sleepSlider.value; updateRangeProgress(sleepSlider); });
    socialWithdrawalSlider.addEventListener('input', () => { withdrawalValSpan.textContent = socialWithdrawalSlider.value; updateRangeProgress(socialWithdrawalSlider); });
    attentionSlider.addEventListener('input', () => { attentionValSpan.textContent = attentionSlider.value; updateRangeProgress(attentionSlider); });
    functioningSlider.addEventListener('input', () => { functioningValSpan.textContent = functioningSlider.value; updateRangeProgress(functioningSlider); });

    // --- Core Assessment Logic ---
    async function runAssessment(source) {
        let inputData;
        
        if (source === 'sliders') {
             inputData = { suspiciousness: parseFloat(suspiciousnessSlider.value), coherence: parseFloat(coherenceSlider.value), sleep: parseFloat(sleepSlider.value), social_withdrawal: parseFloat(socialWithdrawalSlider.value), attention: parseFloat(attentionSlider.value), functioning: parseFloat(functioningSlider.value) };
        } else if (source === 'text') {
             const text = document.getElementById('clinician-text-input').value;
             if (text.length > 50) {
                 // High Risk Simulation (for detailed, concerning narratives)
                 inputData = { suspiciousness: 9.0, coherence: 2.0, sleep: 3.5, social_withdrawal: 9.0, attention: 8.5, functioning: 9.0 }; 
             } else {
                 // FIX: Low Risk Simulation (for brief, positive phrases like "intact social function")
                 // Any text under 50 characters now correctly maps to a protective, Low Risk profile.
                 inputData = { suspiciousness: 0.5, coherence: 9.0, sleep: 9.0, social_withdrawal: 0.5, attention: 0.5, functioning: 0.5 };
             }
             alert(`Simulating assessment based on text analysis. Using inputs for 6 metrics.`);
        }

        const button = (source === 'sliders') ? assessButton : analyzeTextButton;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assessing...';

        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inputData) });
            const result = await response.json();

            if (response.ok) {
                updateDashboard(result);
                assessmentRun = true;
            } else {
                alert(`Error from server: ${result.error}`);
            }

        } catch (error) {
            console.error('Fetch error:', error);
            alert('Failed to connect to the backend. Ensure Python server is running.');
        } finally {
            button.disabled = false;
            button.innerHTML = (source === 'sliders') ? 'Run Assessment' : '<i class="fas fa-robot"></i> Analyze Text';
        }
    }

    // --- Event Listeners for Assessment Buttons ---
    assessButton.addEventListener('click', () => runAssessment('sliders'));
    analyzeTextButton.addEventListener('click', () => runAssessment('text'));


    // --- TIMELINE UTILITIES ---

    // Function to convert minutes to HH:MM AM/PM format
    function minutesToTime(minutes) {
        let h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const period = h >= 12 && h < 24 ? 'PM' : 'AM'; 
        const displayH = h % 12 || 12; 
        const displayM = m < 10 ? '0' + m : m;
        return `${displayH}:${displayM} ${period}`;
    }

    /**
     * Creates and displays the Health Plan Timeline based on risk level.
     */
    function generateHealthPlan(riskLevel) {
        const minTime = 0; 
        const maxTime = 1440; 
        const totalDuration = maxTime - minTime;
        const visualizationWidth = 3600; 
        const plans = { 
             'Low': [{ text: 'Sleep Phase (Night)', className: 'timeline-item-low', start_min: 0, top_row: false }, { text: 'Morning Routine & Sunlight', className: 'timeline-item-default', start_min: 420, top_row: true }, { text: 'Psychoeducation Session', className: 'timeline-item-low', start_min: 540, top_row: false }, { text: 'Mindfulness Practice', className: 'timeline-item-low', start_min: 750, top_row: true }, { text: 'Routine Check-in', className: 'timeline-item-default', start_min: 1080, top_row: false }, { text: 'Social Connection Time', className: 'timeline-item-low', start_min: 1260, top_row: true }, { text: 'Pre-sleep Wind-down', className: 'timeline-item-default', start_min: 1320, top_row: false }, ], 
             'Moderate': [ { text: 'Sleep Monitoring Phase', className: 'timeline-item-mod', start_min: 120, top_row: false }, { text: 'Initial CBT for Anxiety', className: 'timeline-item-mod', start_min: 480, top_row: true }, { text: 'Social Skill Training (SST)', className: 'timeline-item-mod', start_min: 660, top_row: false }, { text: 'Family Check-in', className: 'timeline-item-mod', start_min: 780, top_row: true }, { text: 'Sleep Hygiene Intervention', className: 'timeline-item-mod', start_min: 960, top_row: false }, { text: 'Monthly Clinical Review', className: 'timeline-item-default', start_min: 1140, top_row: true }, { text: 'Late Evening Calm', className: 'timeline-item-mod', start_min: 1350, top_row: false }, ], 
             'High': [ { text: 'Night-time Surveillance', className: 'timeline-item-high', start_min: 30, top_row: true }, { text: 'URGENT: Diagnostic Interview', className: 'timeline-item-high', start_min: 360, top_row: false }, { text: 'Medication Review', className: 'timeline-item-high', start_min: 600, top_row: true }, { text: 'Start Supportive Therapy', className: 'timeline-item-high', start_min: 780, top_row: false }, { text: 'Symptom Tracking (PM)', className: 'timeline-item-high', start_min: 1020, top_row: true }, { text: 'Crisis Plan Session', className: 'timeline-item-high', start_min: 1100, top_row: false }, { text: 'Emergency Contact Check', className: 'timeline-item-default', start_min: 1380, top_row: true }, ],
        };
        const activePlan = plans[riskLevel] || [];
        timelineItemsContainer.style.width = `${visualizationWidth}px`;
        timeAxis.style.width = `${visualizationWidth}px`;
        timelineItemsContainer.innerHTML = '';
        timeAxis.innerHTML = '';
        for (let m = minTime; m < maxTime; m += 60) {
            const timePct = ((m - minTime) / totalDuration) * 100;
            const positionPx = (timePct / 100) * visualizationWidth;
            const label = document.createElement('span');
            label.className = 'time-label';
            label.textContent = minutesToTime(m); 
            label.style.left = `${positionPx}px`; 
            timeAxis.appendChild(label);
        }
        const newCardWidth = 140; 
        const newCardOffset = 70;
        activePlan.forEach(item => {
            const div = document.createElement('div');
            div.className = `timeline-item ${item.className}`;
            div.textContent = item.text;
            const startPct = ((item.start_min - minTime) / totalDuration) * 100;
            const positionPx = (startPct / 100) * visualizationWidth;
            div.style.left = `${positionPx - newCardOffset}px`; 
            div.style.top = item.top_row ? '10px' : '80px'; 
            div.style.width = `${newCardWidth}px`; 
            timelineItemsContainer.appendChild(div);
        });
    }


    function updateDashboard(data) {
        const riskScore = data.risk_score;
        const riskLevel = data.risk_level;
        reportLink.dataset.riskLevel = riskLevel;
        reportLink.dataset.riskScore = riskScore;
        let scoreColor;
        let riskName;
        let titleColor = text1; 
        
        if (riskScore >= 65) {
            scoreColor = highRiskColor;
            riskName = 'High Risk';
        } else if (riskScore >= 35) {
            scoreColor = moderateRiskColor;
            riskName = 'Moderate Risk';
        } else {
            scoreColor = lowRiskColor;
            riskName = 'Low Risk';
        }
        
        riskChart.setOption({
            series: [{
                progress: { itemStyle: { color: scoreColor } },
                detail: { color: scoreColor },
                data: [{ value: riskScore, name: riskName }],
                title: { color: titleColor } 
            }]
        });

        triggeredRulesList.innerHTML = '';
        data.triggered_fuzzy_rules.forEach(rule => {
            const li = document.createElement('li');
            li.textContent = rule;
            triggeredRulesList.appendChild(li);
        });

        actionPlanTextElement.classList.remove('low-risk-text', 'moderate-risk-text', 'high-risk-text', 'muted-text-initial');
        let planText = '';
        if (riskScore >= 65) {
            actionPlanTextElement.classList.add('high-risk-text');
            planText = `<i class="fas fa-exclamation-triangle"></i> Next Step: URGENT referral for specialist diagnostic interview and intensive monitoring.`;
        } else if (riskScore >= 35) {
            actionPlanTextElement.classList.add('moderate-risk-text');
            planText = `<i class="fas fa-hand-holding-medical"></i> Next Step: Initiating preventative CBT and supportive psychological intervention.`;
        } else {
             actionPlanTextElement.classList.add('low-risk-text');
             planText = `<i class="fas fa-check-circle"></i> Next Step: Recommend psychoeducation and routine follow-up in 6 months.`;
        }
        actionPlanTextElement.innerHTML = planText;
        
        generateHealthPlan(riskLevel);
    }
    
    // Initial Health Plan generation
    generateHealthPlan(''); 
    
    // --- INITIAL SLIDER PROGRESS SETUP ---
    const allSliders = [
        suspiciousnessSlider, coherenceSlider, sleepSlider,
        socialWithdrawalSlider, attentionSlider, functioningSlider
    ];
    allSliders.forEach(slider => { updateRangeProgress(slider); });
});