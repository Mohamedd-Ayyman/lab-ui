"use client";
import React, { useState } from "react";
import Image from "next/image";

const BloodPressureMonitor = () => {
  const BP_CATEGORIES = {
    hypotension: { systolic: 90, diastolic: 60 },
    normal: { systolic: 120, diastolic: 80 },
    elevated: { systolic: 130, diastolic: 80 },
    hypertension_stage1: { systolic: 140, diastolic: 90 },
    hypertension_stage2: { systolic: 160, diastolic: 100 },
    hypertensive_crisis: { systolic: 180, diastolic: 120 },
  };

  const [inputs, setInputs] = useState({
    patient_age: "45",
    patient_weight: "70",
    activity_level: "resting",
    arm_position: "heart_level",
    cuff_size: "adult_standard",
    recent_caffeine: false,
    recent_exercise: false,
  });

  const [results, setResults] = useState(null);

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const calculateBloodPressure = () => {
    try {
      const age = parseInt(inputs.patient_age);
      const weight = parseFloat(inputs.patient_weight);

      if (age <= 0) throw new Error("Age must be positive");
      if (weight <= 0) throw new Error("Weight must be positive");

      let systolic = 120;

      if (age < 18) {
        systolic = 95 + age * 0.5;
      } else if (age > 30) {
        systolic = 120 + (age - 20) * 0.5;
      }

      let diastolic = 80;

      if (age < 18) {
        diastolic = 60 + age * 0.3;
      } else if (age > 30) {
        diastolic = 80 + (age - 20) * 0.2;
      }

      const activityEffects = {
        resting: { sys: 0, dias: 0 },
        sitting: { sys: 5, dias: 3 },
        standing: { sys: 10, dias: 5 },
        post_exercise: { sys: 30, dias: 15 },
      };
      const activity =
        activityEffects[inputs.activity_level] || activityEffects.resting;
      systolic += activity.sys;
      diastolic += activity.dias;

      const positionEffects = {
        heart_level: 0,
        above_heart: -10,
        below_heart: 10,
      };
      const positionEffect = positionEffects[inputs.arm_position] || 0;
      systolic += positionEffect;
      diastolic += positionEffect;

      const cuffEffects = {
        pediatric: weight > 30 ? 15 : 0,
        adult_small: weight > 70 ? 10 : 0,
        adult_standard: 0,
        adult_large: weight < 50 ? -5 : 0,
        thigh: 5,
      };
      const cuffEffect = cuffEffects[inputs.cuff_size] || 0;
      systolic += cuffEffect;
      diastolic += cuffEffect;

      if (inputs.recent_caffeine) {
        systolic += 10;
        diastolic += 5;
      }

      if (inputs.recent_exercise) {
        systolic += 15;
        diastolic += 8;
      }

      systolic += (Math.random() - 0.5) * 6;
      diastolic += (Math.random() - 0.5) * 6;

      systolic = Math.round(systolic);
      diastolic = Math.round(diastolic);

      if (diastolic >= systolic) {
        diastolic = systolic - 20;
      }

      const pulse_pressure = systolic - diastolic;
      const mean_arterial_pressure = Math.round(diastolic + pulse_pressure / 3);

      let category = "NORMAL";
      let category_description = "Normal blood pressure";

      if (
        systolic < BP_CATEGORIES.hypotension.systolic ||
        diastolic < BP_CATEGORIES.hypotension.diastolic
      ) {
        category = "HYPOTENSION";
        category_description = "Low blood pressure";
      } else if (
        systolic >= BP_CATEGORIES.hypertensive_crisis.systolic ||
        diastolic >= BP_CATEGORIES.hypertensive_crisis.diastolic
      ) {
        category = "HYPERTENSIVE CRISIS";
        category_description = "Medical emergency - seek immediate care";
      } else if (
        systolic >= BP_CATEGORIES.hypertension_stage2.systolic ||
        diastolic >= BP_CATEGORIES.hypertension_stage2.diastolic
      ) {
        category = "HYPERTENSION STAGE 2";
        category_description = "High blood pressure requiring medication";
      } else if (
        systolic >= BP_CATEGORIES.hypertension_stage1.systolic ||
        diastolic >= BP_CATEGORIES.hypertension_stage1.diastolic
      ) {
        category = "HYPERTENSION STAGE 1";
        category_description = "High blood pressure - lifestyle changes needed";
      } else if (
        systolic >= BP_CATEGORIES.elevated.systolic &&
        diastolic < BP_CATEGORIES.elevated.diastolic
      ) {
        category = "ELEVATED";
        category_description = "Elevated - at risk for hypertension";
      }

      const warnings = [];
      const recommendations = [];

      if (category === "HYPERTENSIVE CRISIS") {
        warnings.push("CRITICAL: Seek emergency medical attention immediately");
        warnings.push("Risk of stroke, heart attack, or organ damage");
      } else if (category === "HYPOTENSION") {
        warnings.push("Low blood pressure detected");
        warnings.push("May cause dizziness or fainting");
        recommendations.push("Consult healthcare provider if symptomatic");
      } else if (category.includes("HYPERTENSION")) {
        warnings.push("High blood pressure detected");
        recommendations.push("Schedule appointment with healthcare provider");
        recommendations.push("Monitor BP regularly");
      } else if (category === "ELEVATED") {
        recommendations.push("Adopt heart-healthy lifestyle changes");
        recommendations.push("Reduce sodium intake");
        recommendations.push("Increase physical activity");
      }

      if (inputs.cuff_size === "pediatric" && weight > 30) {
        warnings.push(
          "WARNING: Cuff size too small - reading may be falsely elevated"
        );
      }
      if (inputs.cuff_size === "adult_large" && weight < 50) {
        warnings.push(
          "WARNING: Cuff size too large - reading may be falsely low"
        );
      }
      if (inputs.arm_position !== "heart_level") {
        warnings.push("CAUTION: Arm not at heart level - may affect accuracy");
      }
      if (inputs.recent_caffeine || inputs.recent_exercise) {
        warnings.push(
          "NOTE: Recent caffeine/exercise may temporarily elevate readings"
        );
        recommendations.push(
          "Retest after 30 minutes of rest for baseline reading"
        );
      }

      if (pulse_pressure < 25) {
        warnings.push(
          "LOW pulse pressure detected - may indicate cardiac issues"
        );
      } else if (pulse_pressure > 60) {
        warnings.push(
          "HIGH pulse pressure detected - may indicate arterial stiffness"
        );
      }

      let status = "NORMAL";
      if (category === "HYPERTENSIVE CRISIS" || category === "HYPOTENSION") {
        status = "CRITICAL";
      } else if (category.includes("HYPERTENSION")) {
        status = "WARNING";
      } else if (category === "ELEVATED") {
        status = "CAUTION";
      }

      setResults({
        status,
        blood_pressure: {
          systolic_mmhg: systolic,
          diastolic_mmhg: diastolic,
          pulse_pressure_mmhg: pulse_pressure,
          mean_arterial_pressure_mmhg: mean_arterial_pressure,
        },
        classification: {
          category,
          description: category_description,
        },
        patient_data: {
          age_years: age,
          weight_kg: weight,
          activity_level: inputs.activity_level,
        },
        measurement_conditions: {
          arm_position: inputs.arm_position,
          cuff_size: inputs.cuff_size,
          recent_caffeine: inputs.recent_caffeine,
          recent_exercise: inputs.recent_exercise,
        },
        clinical_assessment: {
          warnings,
          recommendations,
        },
        timestamp: new Date(),
      });
    } catch (e) {
      setResults({
        status: "ERROR",
        error_message: e.message,
        timestamp: new Date(),
      });
    }
  };

  const getStatusInfo = () => {
    if (!results)
      return { text: "● Awaiting measurement", color: "text-gray-400" };
    if (results.status === "ERROR")
      return { text: "✖ ERROR - Invalid input", color: "text-red-500" };
    if (results.status === "CRITICAL")
      return {
        text: "✖ CRITICAL - Immediate attention required",
        color: "text-red-500",
      };
    if (results.status === "WARNING")
      return {
        text: "⚠ WARNING - Medical consultation recommended",
        color: "text-orange-500",
      };
    if (results.status === "CAUTION")
      return {
        text: "⚠ CAUTION - Monitor and adjust lifestyle",
        color: "text-orange-500",
      };
    return {
      text: "● NORMAL - Blood pressure within healthy range",
      color: "text-green-400",
    };
  };

  const status = getStatusInfo();

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-[#00d4ff] text-center mb-8">
          🩺 Blood Pressure Monitor
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#16213e] rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-200 mb-6">
              Input Parameters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">
                  Patient Age (years)
                </label>
                <input
                  type="number"
                  value={inputs.patient_age}
                  onChange={(e) =>
                    handleInputChange("patient_age", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Patient Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.patient_weight}
                  onChange={(e) =>
                    handleInputChange("patient_weight", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Activity Level
                </label>
                <select
                  value={inputs.activity_level}
                  onChange={(e) =>
                    handleInputChange("activity_level", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                >
                  <option value="resting">Resting (5+ min)</option>
                  <option value="sitting">Sitting</option>
                  <option value="standing">Standing</option>
                  <option value="post_exercise">Post-Exercise</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Arm Position</label>
                <select
                  value={inputs.arm_position}
                  onChange={(e) =>
                    handleInputChange("arm_position", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                >
                  <option value="heart_level">At Heart Level</option>
                  <option value="above_heart">Above Heart</option>
                  <option value="below_heart">Below Heart</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Cuff Size</label>
                <select
                  value={inputs.cuff_size}
                  onChange={(e) =>
                    handleInputChange("cuff_size", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                >
                  <option value="pediatric">Pediatric (&lt;30kg)</option>
                  <option value="adult_small">Adult Small (50-70kg)</option>
                  <option value="adult_standard">
                    Adult Standard (70-90kg)
                  </option>
                  <option value="adult_large">Adult Large (&gt;90kg)</option>
                  <option value="thigh">Thigh Cuff</option>
                </select>
              </div>

              <div>
                <label className="flex items-center text-gray-400">
                  <input
                    type="checkbox"
                    checked={inputs.recent_caffeine}
                    onChange={(e) =>
                      handleInputChange("recent_caffeine", e.target.checked)
                    }
                    className="mr-2"
                  />
                  Caffeine within 30 minutes
                </label>
              </div>

              <div>
                <label className="flex items-center text-gray-400">
                  <input
                    type="checkbox"
                    checked={inputs.recent_exercise}
                    onChange={(e) =>
                      handleInputChange("recent_exercise", e.target.checked)
                    }
                    className="mr-2"
                  />
                  Exercise within 30 minutes
                </label>
              </div>

              <button
                onClick={calculateBloodPressure}
                className="w-full bg-[#00d4ff] text-[#1a1a2e] font-bold py-3 rounded hover:bg-[#00b8d4] transition-colors cursor-pointer"
              >
                ⚡ MEASURE
              </button>
            </div>
          </div>

          <div className="bg-[#16213e] rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-200 mb-4">Results</h2>

            <div className={`font-bold mb-6 ${status.color}`}>
              {status.text}
            </div>

            <div className="bg-[#0f3460] rounded p-6 space-y-2 text-gray-200 font-mono text-sm max-h-[600px] overflow-y-auto">
              {results && !results.error_message ? (
                <>
                  <div className="text-[#00d4ff] font-bold mb-4">
                    BLOOD PRESSURE READING
                  </div>
                  <div className="text-4xl font-bold text-center my-6">
                    {results.blood_pressure.systolic_mmhg} /{" "}
                    {results.blood_pressure.diastolic_mmhg}
                  </div>
                  <div className="text-center text-gray-400 mb-6">
                    mmHg (Systolic / Diastolic)
                  </div>

                  <div className="text-[#00d4ff] font-bold mt-6 mb-4">
                    CLASSIFICATION
                  </div>
                  <div>Category: {results.classification.category}</div>
                  <div>Description: {results.classification.description}</div>

                  <div className="text-[#00d4ff] font-bold mt-6 mb-4">
                    CALCULATED VALUES
                  </div>
                  <div>
                    Pulse Pressure: {results.blood_pressure.pulse_pressure_mmhg}{" "}
                    mmHg
                  </div>
                  <div>
                    Mean Arterial Pressure:{" "}
                    {results.blood_pressure.mean_arterial_pressure_mmhg} mmHg
                  </div>

                  <div className="text-[#00d4ff] font-bold mt-6 mb-4">
                    PATIENT DATA
                  </div>
                  <div>Age: {results.patient_data.age_years} years</div>
                  <div>Weight: {results.patient_data.weight_kg} kg</div>
                  <div>
                    Activity:{" "}
                    {results.patient_data.activity_level.replace("_", " ")}
                  </div>

                  <div className="text-[#00d4ff] font-bold mt-6 mb-4">
                    MEASUREMENT CONDITIONS
                  </div>
                  <div>
                    Arm Position:{" "}
                    {results.measurement_conditions.arm_position.replace(
                      "_",
                      " "
                    )}
                  </div>
                  <div>
                    Cuff Size:{" "}
                    {results.measurement_conditions.cuff_size.replace("_", " ")}
                  </div>
                  <div>
                    Recent Caffeine:{" "}
                    {results.measurement_conditions.recent_caffeine
                      ? "YES"
                      : "NO"}
                  </div>
                  <div>
                    Recent Exercise:{" "}
                    {results.measurement_conditions.recent_exercise
                      ? "YES"
                      : "NO"}
                  </div>

                  {results.clinical_assessment.warnings.length > 0 && (
                    <>
                      <div className="text-orange-500 font-bold mt-6 mb-4">
                        WARNINGS
                      </div>
                      {results.clinical_assessment.warnings.map((w, i) => (
                        <div key={i} className="text-orange-400">
                          ⚠ {w}
                        </div>
                      ))}
                    </>
                  )}

                  {results.clinical_assessment.recommendations.length > 0 && (
                    <>
                      <div className="text-[#00d4ff] font-bold mt-6 mb-4">
                        RECOMMENDATIONS
                      </div>
                      {results.clinical_assessment.recommendations.map(
                        (r, i) => (
                          <div key={i} className="text-gray-300">
                            • {r}
                          </div>
                        )
                      )}
                    </>
                  )}

                  <div className="text-gray-500 text-xs mt-6">
                    Measured: {results.timestamp.toLocaleString()}
                  </div>
                </>
              ) : results && results.error_message ? (
                <div className="text-red-400">
                  <div className="text-red-500 font-bold mb-4">ERROR</div>
                  <div>✖ {results.error_message}</div>
                  <div className="mt-4 text-gray-400">
                    Timestamp: {results.timestamp.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">
                  Enter parameters and click Measure to see results
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Image
        src="/ahaimage.jpg"
        alt="American Heart Association Blood Pressure Chart"
        width={400}
        height={250}
        className="rounded-lg mx-auto py-4"
      />
      <div className="flex justify-center mb-6">
        <Image
          src="/deviceimg.jpg"
          alt="Blood Pressure Monitor Device"
          width={280}
          height={280}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

export default BloodPressureMonitor;
