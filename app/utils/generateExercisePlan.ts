// --- Data Structures & Interfaces ---

export enum FitnessLevel {
    Beginner = 'beginner',
    Intermediate = 'intermediate',
    Expert = 'expert',
  }
  
  /**
   * Represents the base data for a single exercise.
   * This structure should match the objects in your JSON file.
   * Note that the names and descriptions are in German.
   */
  interface ExerciseData {
    name: string;
    type: 'legs' | 'upper_body_push' | 'upper_body_back' | 'core' | 'full_body_plyo' | 'flexibility_mobility';
    met: {
      low: number;
      medium: number;
      high: number;
    };
    description: string;
  }
  
  /**
   * Defines the user inputs needed for the calculations.
   */
  interface WorkoutRequest {
    weightKg: number;           // User's weight in kilograms
    fitnessLevel: FitnessLevel; // User's fitness level
    exerciseName: string;       // Name of the chosen exercise
    intensity: 'low' | 'medium' | 'high'; // Chosen intensity
    targetCalories?: number;    // Optional: Desired calorie burn
  }
  
  /**
   * The final, structured workout plan to be returned.
   */
  interface ExercisePlan {
    exercise: string;
    sets: number;
    reps: string; // e.g., "2;3;2;3;2" for exercise and break
    estimatedCalories: number;
    notes: string;
  }
  
  // --- Core Calculation Logic ---
  
  /**
   * Calculates a workout plan based on user input and exercise data.
   * @param request The user's workout request.
   * @param exercisesData An array of all available exercise data (from the JSON file).
   * @returns A structured ExercisePlan object or null if the exercise is not found.
   */
  export function generateExercisePlan(
    request: WorkoutRequest,
    exercisesData: ExerciseData[]
  ): ExercisePlan | null {
    
    // 1. Find the requested exercise in the data
    const exercise = exercisesData.find(
      (ex) => ex.name.toLowerCase() === request.exerciseName.toLowerCase()
    );
  
    if (!exercise) {
      console.error(`Exercise "${request.exerciseName}" not found.`);
      return null;
    }
  
    // 2. Determine the MET value and calculate the calorie burn rate
    const metValue = exercise.met[request.intensity];
    const caloriesPerMinute = (metValue * request.weightKg) / 60;
  
    // 3. Determine the number of sets based on fitness level. This is now the primary driver for volume.
    let numSets: number;
    switch (request.fitnessLevel) {
      case FitnessLevel.Beginner:
        numSets = 3;
        break;
      case FitnessLevel.Intermediate:
        numSets = 4;
        break;
      case FitnessLevel.Expert:
        numSets = 5;
        break;
      default:
        numSets = 4;
    }
  
    // 4. Determine work and rest durations
    let workDuration: number;
    let restDuration: number;
  
    // Set rest duration based on intensity. This remains constant.
    switch (request.intensity) {
      case 'low':
        restDuration = 3;
        break;
      case 'medium':
        restDuration = 2;
        break;
      case 'high':
        restDuration = 1.5;
        break;
      default:
        restDuration = 2;
    }
  
    if (request.targetCalories && request.targetCalories > 0) {
      // If a calorie target is set, calculate the required work duration per set to meet the goal.
      const totalActiveMinutesNeeded = request.targetCalories / caloriesPerMinute;
      workDuration = totalActiveMinutesNeeded / numSets;
    } else {
      // If no calorie target, use default logic for work duration.
      // Base work times based on user's perceived intensity
      switch (request.intensity) {
        case 'low':
          workDuration = 1.5;
          break;
        case 'medium':
          workDuration = 2;
          break;
        case 'high':
          workDuration = 2.5;
          break;
        default:
          workDuration = 2;
      }
  
      // Adjust default work duration based on the exercise's intrinsic difficulty (MET value)
      if (metValue > 7.0) { // Very High Intensity Exercise
          workDuration *= 0.9; // 10% shorter work
      } else if (metValue < 4.0) { // Low Intensity Exercise
          workDuration *= 1.1; // 10% longer work
      }
    }
    
    // Round to nearest quarter minute for sensibility
    workDuration = Math.round(workDuration * 4) / 4;
    if (workDuration < 0.25) workDuration = 0.25; // Ensure a minimum work duration
  
    // 5. Build the 'reps' string and calculate total work time
    const repsArray: number[] = [];
    let actualTotalWorkTime = 0;
    for (let i = 0; i < numSets; i++) {
        repsArray.push(workDuration);
        actualTotalWorkTime += workDuration;
        // Add a break after each work unit, except for the last one
        if (i < numSets - 1) { 
            repsArray.push(restDuration);
        }
    }
  
    const plan = {
        exercise: exercise.name,
        sets: numSets,
        reps: repsArray.join(';'),
    };
    
    // 6. Calculate the final estimated calories and create notes
    const estimatedCalories = Math.round(actualTotalWorkTime * caloriesPerMinute);
    
    const notes = exercise.description;
  
    return {
      ...plan,
      estimatedCalories,
      notes,
    };
  }
  
  // --- Example Usage ---
  /*
  // Assuming you have loaded your JSON file into this variable:
  const allExercises: ExerciseData[] = [
    {
      "name": "Kniebeugen",
      "type": "legs",
      "met": { "low": 3.5, "medium": 5.5, "high": 7.5 },
      "description": "Stehe mit den Füßen schulterbreit auseinander, Brust raus und Rumpf angespannt..."
    },
    {
      "name": "Liegestütze",
      "type": "upper_body_push",
      "met": { "low": 3.8, "medium": 6.0, "high": 8.0 },
      "description": "Platziere die Hände etwas breiter als deine Schultern..."
    }
    // ... all other exercises
  ];
  
  // Example 1: Beginner user, default duration (no calorie target)
  const userRequest1: WorkoutRequest = {
    weightKg: 80,
    fitnessLevel: FitnessLevel.Beginner,
    exerciseName: 'Kniebeugen',
    intensity: 'low',
  };
  
  const workoutPlan1 = generateExercisePlan(userRequest1, allExercises);
  console.log('--- Beginner, Default Duration ---');
  console.log(workoutPlan1);
  // Expected output: 3 sets, default work duration
  // {
  //   exercise: 'Kniebeugen',
  //   sets: 3,
  //   reps: '1.75;3;1.75;3;1.75',
  //   estimatedCalories: 37,
  //   notes: '...'
  // }
  
  
  // Example 2: Beginner user with a HIGH calorie target
  const userRequest2: WorkoutRequest = {
    weightKg: 80,
    fitnessLevel: FitnessLevel.Beginner,
    exerciseName: 'Kniebeugen',
    intensity: 'low',
    targetCalories: 150, // High target
  };
  
  const workoutPlan2 = generateExercisePlan(userRequest2, allExercises);
  console.log('\n--- Beginner, High Calorie Target ---');
  console.log(workoutPlan2);
  // Expected output: 3 sets (for beginner), but work duration is increased to meet calorie goal
  // {
  //   exercise: 'Kniebeugen',
  //   sets: 3,
  //   reps: '10.75;3;10.75;3;10.75',
  //   estimatedCalories: 150,
  //   notes: '...'
  // }
  */
  