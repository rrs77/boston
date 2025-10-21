// Check localStorage for lesson data by sheet
const sheets = ['EYFS', 'LKG', 'UKG', 'Reception', 'Year1', 'Year2'];

console.log('=== Checking Lesson Data by Sheet ===\n');

sheets.forEach(sheet => {
  const key = `lesson-data-${sheet}`;
  const data = localStorage.getItem(key);
  
  if (data) {
    try {
      const parsed = JSON.parse(data);
      const lessonCount = Object.keys(parsed.allLessonsData || {}).length;
      console.log(`${sheet}: ${lessonCount} lessons`);
    } catch (e) {
      console.log(`${sheet}: Error parsing data`);
    }
  } else {
    console.log(`${sheet}: No data found`);
  }
});
