// Test script to verify group functionality
import { GroupItem, WorkoutItem } from '../components/data.provider';

// Mock data for testing
const mockWorkouts: WorkoutItem[] = [
  { name: 'Push-ups', workout: '30;60;30', group: undefined },
  { name: 'Squats', workout: '45;60;45', group: undefined },
  { name: 'Plank', workout: '60;30;60', group: undefined },
  { name: 'Lunges', workout: '30;30;30', group: undefined },
];

const mockGroups: GroupItem[] = [
  {
    name: 'Upper Body',
    workouts: [
      { orderId: 1, name: 'Push-ups' },
      { orderId: 2, name: 'Plank' }
    ]
  },
  {
    name: 'Lower Body',
    workouts: [
      { orderId: 1, name: 'Squats' },
      { orderId: 2, name: 'Lunges' }
    ]
  }
];

// Test filtering logic
function testGroupFiltering() {
  console.log('Testing group filtering...');
  
  // Test 1: Get workouts for "Upper Body" group
  const upperBodyGroup = mockGroups.find(g => g.name === 'Upper Body');
  if (upperBodyGroup) {
    const sortedGroupWorkouts = [...upperBodyGroup.workouts].sort((a, b) => a.orderId - b.orderId);
    const groupWorkouts = sortedGroupWorkouts
      .map(gw => mockWorkouts.find(wi => wi.name === gw.name))
      .filter((item): item is WorkoutItem => item !== undefined);
    
    console.log('Upper Body workouts:', groupWorkouts.map(w => w.name));
    // Expected: ['Push-ups', 'Plank']
  }
  
  // Test 2: Get workouts for "Lower Body" group
  const lowerBodyGroup = mockGroups.find(g => g.name === 'Lower Body');
  if (lowerBodyGroup) {
    const sortedGroupWorkouts = [...lowerBodyGroup.workouts].sort((a, b) => a.orderId - b.orderId);
    const groupWorkouts = sortedGroupWorkouts
      .map(gw => mockWorkouts.find(wi => wi.name === gw.name))
      .filter((item): item is WorkoutItem => item !== undefined);
    
    console.log('Lower Body workouts:', groupWorkouts.map(w => w.name));
    // Expected: ['Squats', 'Lunges']
  }
  
  // Test 3: Show all workouts
  console.log('All workouts:', mockWorkouts.map(w => w.name));
  // Expected: ['Push-ups', 'Squats', 'Plank', 'Lunges']
}

testGroupFiltering();
