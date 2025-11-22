import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle, Info, BookOpen, Calendar, Edit3, FolderOpen, Tag, Search, Filter, Download, Plus, Save, Check, Clock, Users } from 'lucide-react';

interface GuideStep {
  title: string;
  content: React.ReactNode;
  image?: string;
  highlightSelector?: string;
}

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: 'activity' | 'lesson' | 'unit' | 'assign';
}

export function HelpGuide({ isOpen, onClose, initialSection }: HelpGuideProps) {
  const [activeSection, setActiveSection] = useState<'activity' | 'lesson' | 'unit' | 'assign'>(initialSection || 'activity');
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipArrowPosition, setTooltipArrowPosition] = useState('top');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOverviewMinimized, setIsOverviewMinimized] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Trigger animation when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setIsOverviewMinimized(false); // Reset on open
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle scroll to minimize overview
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setIsOverviewMinimized(scrollTop > 50);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Define guide steps for each section
  const activitySteps: GuideStep[] = [
    {
      title: "Creating a New Activity",
      content: (
        <div className="space-y-3">
          <p>Start by navigating to the <strong>Activity Library</strong> tab in the main navigation.</p>
          <p>Click the <strong>Create Activity</strong> button at the top of the page to open the activity creation form.</p>
          <div className="bg-teal-50 border-l-4 border-teal-500 p-3 rounded">
            <p className="text-sm text-teal-900"><strong>Tip:</strong> Activities are the building blocks of your lessons. Create reusable activities that can be combined in different ways across multiple lessons.</p>
          </div>
        </div>
      ),
      highlightSelector: '[data-tab="activity-library"]'
    },
    {
      title: "Fill in Activity Details",
      content: (
        <div className="space-y-3">
          <p>Provide the essential information for your activity:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Activity Name:</strong> Choose a clear, descriptive name that helps identify the activity quickly</li>
            <li><strong>Curriculum Objectives:</strong> Click to choose objectives from EYFS or custom year group curriculum standards</li>
            <li><strong>Category:</strong> Select from predefined categories (e.g., Warm-up, Singing, Instruments, Movement) or create custom categories in Settings</li>
            <li><strong>Year Groups:</strong> Select multiple year groups this activity is suitable for (checkboxes allow multi-selection)</li>
            <li><strong>Duration:</strong> Set the expected duration in minutes to help with lesson planning</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mt-3">
            <p className="text-sm text-amber-900"><strong>Note:</strong> Selecting curriculum objectives helps track standards coverage across your lessons and units.</p>
          </div>
        </div>
      )
    },
    {
      title: "Add Activity Content",
      content: (
        <div className="space-y-3">
          <p>Use the rich text editor to provide comprehensive content:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Introduction/Context:</strong> Provide background information, learning goals, or teaching notes that set up the activity</li>
            <li><strong>Activity Instructions:</strong> Write detailed step-by-step instructions for delivering the activity in class</li>
            <li><strong>Formatting:</strong> Use the toolbar to add bold text, italic, bullet lists, and numbered lists for clarity</li>
            <li><strong>Print Preview:</strong> A dividing line automatically separates these two sections in PDF exports</li>
          </ul>
          <div className="p-3 rounded mt-3" style={{backgroundColor: '#E6F7F5', borderLeft: '4px solid #0BA596'}}>
            <p className="text-sm" style={{color: '#0BA596'}}><strong>Best Practice:</strong> Include clear instructions so the activity can be easily delivered by you or a colleague.</p>
          </div>
        </div>
      )
    },
    {
      title: "Add Resources & Links",
      content: (
        <div className="space-y-3">
          <p>Enhance your activity with external resources:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Video Links:</strong> YouTube tutorial videos or demonstration clips</li>
            <li><strong>Audio Files:</strong> Music tracks, backing tracks, or sound effects</li>
            <li><strong>Teaching Materials:</strong> PDFs, worksheets, or online resources</li>
            <li><strong>Images:</strong> Visual aids or reference images</li>
          </ul>
          <p className="mt-3">Simply paste the URL and add a descriptive label. Resources will be accessible directly from the activity and any lessons that include it.</p>
        </div>
      )
    },
    {
      title: "Save Your Activity",
      content: (
        <div className="space-y-3">
          <p>Before saving, review all the information to ensure accuracy:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Check that the name is descriptive and unique</li>
            <li>Verify the category, level, and duration are correct</li>
            <li>Ensure instructions are clear and complete</li>
            <li>Confirm all resource links are working</li>
          </ul>
          <p className="mt-3">Click the <strong>Create Activity</strong> button at the bottom of the form.</p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-3">
            <p className="text-sm text-teal-900"><strong>Success!</strong> Your activity now appears in the Activity Library and is ready to be added to lessons. You can edit or delete it anytime from the library.</p>
          </div>
        </div>
      )
    }
  ];

  const lessonSteps: GuideStep[] = [
    {
      title: "Creating a New Lesson",
      content: (
        <div className="space-y-3">
          <p>Navigate to the <strong>Lesson Builder</strong> tab in the main navigation.</p>
          <p>You'll see a blank lesson template with an activity library panel on the right side.</p>
          <div className="bg-teal-50 border-l-4 border-teal-500 p-3 rounded">
            <p className="text-sm text-teal-900"><strong>Overview:</strong> Lessons are composed of activities from your library. Build a structured lesson by selecting and arranging activities in a logical flow.</p>
          </div>
        </div>
      ),
      highlightSelector: '[data-tab="lesson-builder"]'
    },
    {
      title: "Set Lesson Details",
      content: (
        <div className="space-y-3">
          <p>Start by filling in the essential lesson information:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Lesson Title:</strong> Give your lesson a descriptive name that indicates the focus or topic</li>
            <li><strong>Week Number:</strong> Assign this lesson to a specific week in your curriculum</li>
            <li><strong>Term:</strong> Select the appropriate term (Autumn, Spring, or Summer)</li>
            <li><strong>Year Group:</strong> Choose which year group(s) this lesson is designed for</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mt-3">
            <p className="text-sm text-amber-900"><strong>Planning Tip:</strong> Week numbers help organize lessons chronologically, making it easier to track curriculum coverage throughout the year.</p>
          </div>
        </div>
      )
    },
    {
      title: "Add Activities to Your Lesson",
      content: (
        <div className="space-y-3">
          <p>Browse and add activities from your library using multiple methods:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Drag & Drop:</strong> Click and drag activities directly into your lesson plan</li>
            <li><strong>Bulk Selection:</strong> Check multiple activities and click "Add Selected" to add them all at once</li>
            <li><strong>Search:</strong> Use the search box to quickly find specific activities by name</li>
            <li><strong>Filter:</strong> Filter by category (e.g., Warm-up, Singing, Games) or year group to narrow your options</li>
          </ul>
          <div className="p-3 rounded mt-3" style={{backgroundColor: '#E6F7F5', borderLeft: '4px solid #0BA596'}}>
            <p className="text-sm" style={{color: '#0BA596'}}><strong>Best Practice:</strong> Build a balanced lesson with a mix of activity types - start with a warm-up, include main activities, and end with a cool-down or reflection.</p>
          </div>
        </div>
      )
    },
    {
      title: "Organize Your Lesson Flow",
      content: (
        <div className="space-y-3">
          <p>Once activities are added, organize them for optimal lesson flow:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Auto-Grouping:</strong> Activities are automatically grouped by category for easy viewing</li>
            <li><strong>Reorder:</strong> Drag activities up or down to change the sequence within your lesson</li>
            <li><strong>Remove:</strong> Hover over an activity and click the trash icon to remove it</li>
            <li><strong>Duration Tracking:</strong> The total lesson duration updates automatically as you add or remove activities</li>
          </ul>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mt-3">
            <p className="text-sm text-purple-900"><strong>Time Management:</strong> Keep an eye on the total duration to ensure your lesson fits within the allocated time slot.</p>
          </div>
        </div>
      )
    },
    {
      title: "Add Lesson Notes & Objectives",
      content: (
        <div className="space-y-3">
          <p>Use the <strong>Lesson Notes</strong> section at the bottom to document important details:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Learning Objectives:</strong> What students will learn or achieve</li>
            <li><strong>Teaching Tips:</strong> Reminders for effective delivery</li>
            <li><strong>Required Materials:</strong> Equipment, instruments, or resources needed</li>
            <li><strong>Assessment Notes:</strong> How you'll evaluate student progress</li>
            <li><strong>Differentiation:</strong> Adaptations for different ability levels</li>
          </ul>
          <p className="mt-3">Use the rich text editor toolbar to format your notes with bold text, lists, and paragraphs.</p>
        </div>
      )
    },
    {
      title: "Save & Manage Your Lesson",
      content: (
        <div className="space-y-3">
          <p>When your lesson is complete, you have several save options:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Save Plan:</strong> Saves the lesson and keeps it open for further editing</li>
            <li><strong>Save & New:</strong> Saves the lesson and opens a blank template to create another lesson immediately</li>
            <li><strong>Edit Later:</strong> Access saved lessons from the Unit Builder or Calendar views</li>
          </ul>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-3">
            <p className="text-sm text-teal-900"><strong>Next Step:</strong> Once saved, your lesson is ready to be added to a unit and scheduled on your calendar. You can also duplicate and modify it for different year groups or terms.</p>
          </div>
        </div>
      )
    }
  ];

  const unitSteps: GuideStep[] = [
    {
      title: "Creating a New Unit of Work",
      content: (
        <div className="space-y-3">
          <p>Navigate to the <strong>Unit Builder</strong> tab in the main navigation.</p>
          <p>Click the <strong>Create New</strong> button to start building a fresh unit of work.</p>
          <div className="bg-teal-50 border-l-4 border-teal-500 p-3 rounded">
            <p className="text-sm text-teal-900"><strong>What is a Unit?</strong> A unit is a collection of related lessons organized around a theme or topic, typically covering a half-term (5-7 weeks) of teaching.</p>
          </div>
        </div>
      ),
      highlightSelector: '[data-tab="unit-builder"]'
    },
    {
      title: "Set Unit Details & Description",
      content: (
        <div className="space-y-3">
          <p>Provide the key information for your unit:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Unit Name:</strong> Choose a clear, thematic name (e.g., "Rhythm & Movement", "World Music Exploration")</li>
            <li><strong>Term:</strong> Select the specific half-term (Autumn 1/2, Spring 1/2, Summer 1/2)</li>
            <li><strong>Year Group:</strong> Specify which year group(s) this unit is designed for</li>
            <li><strong>Unit Description:</strong> Write an overview including learning goals, themes, and key outcomes</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mt-3">
            <p className="text-sm text-amber-900"><strong>Planning Tip:</strong> A well-written description helps you and colleagues understand the unit's purpose and progression at a glance.</p>
          </div>
        </div>
      )
    },
    {
      title: "Browse & Select Lessons",
      content: (
        <div className="space-y-3">
          <p>Find and select lessons from your library using the <strong>Available Lessons</strong> panel:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Click to Select:</strong> Click individual lessons to highlight them (hold Shift or Cmd/Ctrl for multiple selections)</li>
            <li><strong>Search:</strong> Use the search box to find lessons by title or content</li>
            <li><strong>Filter by Term:</strong> Narrow down lessons by the term they were created for</li>
            <li><strong>Filter by Year Group:</strong> Show only lessons for specific year groups</li>
            <li><strong>Select All:</strong> Quickly select all filtered lessons at once</li>
          </ul>
          <p className="mt-3">Once selected, click <strong>Add Selected Lessons</strong> to move them into your unit.</p>
        </div>
      )
    },
    {
      title: "Organize Lesson Sequence",
      content: (
        <div className="space-y-3">
          <p>In the <strong>Unit Contents</strong> panel, arrange your lessons for optimal progression:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Reorder Lessons:</strong> Use the up/down arrow buttons to change the sequence</li>
            <li><strong>Remove Lessons:</strong> Click the trash icon to remove a lesson from the unit</li>
            <li><strong>View Details:</strong> Click on a lesson to see its activities and notes</li>
            <li><strong>Check Duration:</strong> Ensure lessons fit your typical class length</li>
          </ul>
          <div className="p-3 rounded mt-3" style={{backgroundColor: '#E6F7F5', borderLeft: '4px solid #0BA596'}}>
            <p className="text-sm" style={{color: '#0BA596'}}><strong>Sequencing Matters:</strong> Order lessons to build skills progressively, starting with foundational concepts and advancing to more complex activities.</p>
          </div>
        </div>
      )
    },
    {
      title: "Save & Manage Your Unit",
      content: (
        <div className="space-y-3">
          <p>Finalize and save your unit of work:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Review all unit details, lesson sequence, and descriptions</li>
            <li>Click the <strong>Save Unit</strong> button to store your unit</li>
            <li>Your unit appears in the <strong>Your Units</strong> panel on the right</li>
            <li>Edit units anytime by selecting them from the list</li>
            <li>Duplicate units to create variations for different year groups</li>
          </ul>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-3">
            <p className="text-sm text-teal-900"><strong>Ready to Schedule:</strong> Your saved unit is now ready to be assigned to specific weeks on your calendar, making it easy to plan your entire academic year.</p>
          </div>
        </div>
      )
    }
  ];

  const assignSteps: GuideStep[] = [
    {
      title: "Understanding the Calendar View",
      content: (
        <div className="space-y-3">
          <p>Navigate to the <strong>Calendar</strong> tab in the main navigation.</p>
          <p>The calendar view shows your entire academic year divided into weeks, with half-term boundaries clearly marked.</p>
          <div className="bg-teal-50 border-l-4 border-teal-500 p-3 rounded">
            <p className="text-sm text-teal-900"><strong>Calendar Overview:</strong> This is where your planning comes to life. Assign units to specific dates to create a complete year-long curriculum map.</p>
          </div>
        </div>
      ),
      highlightSelector: '[data-tab="calendar"]'
    },
    {
      title: "Select a Unit to Schedule",
      content: (
        <div className="space-y-3">
          <p>In the <strong>Your Units</strong> panel (usually on the right), locate the unit you want to schedule:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Browse your saved units organized by term</li>
            <li>Check the unit details to confirm it's the right one</li>
            <li>Click the <strong>Calendar</strong> icon next to the unit name</li>
          </ul>
          <p className="mt-3">This opens the "Add Unit to Calendar" scheduling dialog.</p>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mt-3">
            <p className="text-sm text-amber-900"><strong>Pro Tip:</strong> Review the unit's lesson count and duration before scheduling to ensure it fits your half-term timeline.</p>
          </div>
        </div>
      )
    },
    {
      title: "Choose Start Date & Frequency",
      content: (
        <div className="space-y-3">
          <p>In the scheduling dialog, configure when and how often lessons occur:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Start Date:</strong> Select the date for the first lesson (typically the first week of a half-term)</li>
            <li><strong>Frequency:</strong> Set how often lessons repeat (e.g., weekly, twice per week)</li>
            <li><strong>Days of Week:</strong> Choose which day(s) of the week lessons occur</li>
            <li><strong>Preview:</strong> Review the generated schedule before confirming</li>
          </ul>
          <p className="mt-3">Lessons will be automatically scheduled in sequence, following your unit's lesson order.</p>
        </div>
      )
    },
    {
      title: "Understanding Half-Term Periods",
      content: (
        <div className="space-y-3">
          <p>The system automatically identifies which half-term your scheduled dates fall into:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-orange-50 p-2 rounded border border-orange-200">
              <p className="font-semibold text-orange-900">Autumn 1 (A1)</p>
              <p className="text-sm text-orange-800">September - October</p>
            </div>
            <div className="bg-orange-100 p-2 rounded border border-orange-300">
              <p className="font-semibold text-orange-900">Autumn 2 (A2)</p>
              <p className="text-sm text-orange-800">November - December</p>
            </div>
            <div className="p-2 rounded" style={{backgroundColor: '#E6F7F5', border: '1px solid #B8E6E0'}}>
              <p className="font-semibold" style={{color: '#0BA596'}}>Spring 1 (SP1)</p>
              <p className="text-sm" style={{color: '#0BA596'}}>January - February</p>
            </div>
            <div className="p-2 rounded" style={{backgroundColor: '#D1F2EB', border: '1px solid #0BA596'}}>
              <p className="font-semibold" style={{color: '#0BA596'}}>Spring 2 (SP2)</p>
              <p className="text-sm" style={{color: '#0BA596'}}>March - April</p>
            </div>
            <div className="bg-teal-50 p-2 rounded border border-teal-200">
              <p className="font-semibold text-teal-900">Summer 1 (SM1)</p>
              <p className="text-sm text-teal-800">April - May</p>
            </div>
            <div className="bg-teal-100 p-2 rounded border border-teal-300">
              <p className="font-semibold text-teal-900">Summer 2 (SM2)</p>
              <p className="text-sm text-teal-800">June - July</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Confirm & Add to Calendar",
      content: (
        <div className="space-y-3">
          <p>Review the schedule preview and click <strong>Add to Calendar</strong> to confirm:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Each lesson from your unit is created as a scheduled lesson plan</li>
            <li>Lessons appear on the calendar on their assigned dates</li>
            <li>Units are color-coded for easy visual identification</li>
            <li>Hover over calendar entries to see lesson details</li>
          </ul>
          <div className="p-3 rounded mt-3" style={{backgroundColor: '#E6F7F5', borderLeft: '4px solid #0BA596'}}>
            <p className="text-sm" style={{color: '#0BA596'}}><strong>Scheduled!</strong> Your unit is now on the calendar. You can see at a glance what you're teaching each week throughout the term.</p>
          </div>
        </div>
      )
    },
    {
      title: "Managing & Editing Schedule",
      content: (
        <div className="space-y-3">
          <p>Once units are scheduled, you have full control to manage and adjust:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>View Lessons:</strong> Click any date to see scheduled lesson details</li>
            <li><strong>Edit Lessons:</strong> Click on a lesson to modify activities, notes, or content</li>
            <li><strong>Reschedule:</strong> Drag and drop lessons to different dates, or edit the date directly</li>
            <li><strong>Filter View:</strong> Use the unit filter dropdown to view specific units only</li>
            <li><strong>Print/Export:</strong> Generate printable lesson plans or export your schedule</li>
            <li><strong>Delete:</strong> Remove scheduled lessons if plans change</li>
          </ul>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mt-3">
            <p className="text-sm text-purple-900"><strong>Flexibility:</strong> Your calendar is fully editable. Feel free to adjust as needed - school life rarely goes exactly to plan!</p>
          </div>
        </div>
      )
    }
  ];

  // Get the current steps based on active section
  const getCurrentSteps = () => {
    switch (activeSection) {
      case 'activity':
        return activitySteps;
      case 'lesson':
        return lessonSteps;
      case 'unit':
        return unitSteps;
      case 'assign':
        return assignSteps;
      default:
        return activitySteps;
    }
  };

  const currentSteps = getCurrentSteps();

  // Handle highlighting elements
  useEffect(() => {
    if (!isOpen) return;

    const steps = getCurrentSteps();
    const currentStepData = steps[currentStep];
    
    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.classList.remove('highlight-pulse');
      highlightedElement.classList.remove('ring-4');
      highlightedElement.classList.remove('ring-blue-500');
      highlightedElement.classList.remove('ring-opacity-70');
      highlightedElement.classList.remove('z-40');
    }
    
    // Add highlight to new element
    if (currentStepData.highlightSelector) {
      const element = document.querySelector(currentStepData.highlightSelector) as HTMLElement;
      if (element) {
        element.classList.add('highlight-pulse');
        element.classList.add('ring-4');
        element.classList.add('ring-blue-500');
        element.classList.add('ring-opacity-70');
        element.classList.add('z-40');
        setHighlightedElement(element);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    return () => {
      // Clean up on unmount
      if (highlightedElement) {
        highlightedElement.classList.remove('highlight-pulse');
        highlightedElement.classList.remove('ring-4');
        highlightedElement.classList.remove('ring-blue-500');
        highlightedElement.classList.remove('ring-opacity-70');
        highlightedElement.classList.remove('z-40');
      }
    };
  }, [isOpen, activeSection, currentStep]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // If we're at the last step, move to the next section or close
      if (activeSection === 'activity') {
        setActiveSection('lesson');
        setCurrentStep(0);
      } else if (activeSection === 'lesson') {
        setActiveSection('unit');
        setCurrentStep(0);
      } else if (activeSection === 'unit') {
        setActiveSection('assign');
        setCurrentStep(0);
      } else {
        // We're at the end of the last section
        onClose();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      // If we're at the first step, move to the previous section
      if (activeSection === 'lesson') {
        setActiveSection('activity');
        setCurrentStep(activitySteps.length - 1);
      } else if (activeSection === 'unit') {
        setActiveSection('lesson');
        setCurrentStep(lessonSteps.length - 1);
      } else if (activeSection === 'assign') {
        setActiveSection('unit');
        setCurrentStep(unitSteps.length - 1);
      }
    }
  };

  const getSectionIcon = (section: 'activity' | 'lesson' | 'unit' | 'assign') => {
    switch (section) {
      case 'activity':
        return <Tag className="h-5 w-5" />;
      case 'lesson':
        return <Edit3 className="h-5 w-5" />;
      case 'unit':
        return <FolderOpen className="h-5 w-5" />;
      case 'assign':
        return <Calendar className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <style jsx>{`
        .modal-bounce {
          animation: modalBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes modalBounce {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${
        isAnimating ? 'modal-bounce' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <div className="flex items-center space-x-3">
            <HelpCircle className="h-6 w-6" />
            <h2 className="text-xl font-bold">Creative Curriculum Designer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Overview Section */}
        <div className={`transition-all duration-300 overflow-hidden bg-gradient-to-r from-teal-50 to-blue-50 border-b border-gray-200 ${
          isOverviewMinimized ? 'max-h-0 opacity-0' : 'max-h-96'
        }`}>
          <div className="p-6 max-w-4xl mx-auto">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              A comprehensive planning platform to streamline your curriculum development. Build reusable activities, organize them into structured lessons, group lessons into thematic units, and schedule everything across your academic year.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1.5 text-teal-600">
                  <Tag className="h-3.5 w-3.5" />
                  <h4 className="font-semibold text-xs">Activity Library</h4>
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1.5 text-teal-600">
                  <Edit3 className="h-3.5 w-3.5" />
                  <h4 className="font-semibold text-xs">Lesson Builder</h4>
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1.5 text-indigo-600">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <h4 className="font-semibold text-xs">Unit Planner</h4>
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1.5 text-purple-600">
                  <Calendar className="h-3.5 w-3.5" />
                  <h4 className="font-semibold text-xs">Half-Term Scheduling</h4>
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1.5 text-green-600">
                  <Download className="h-3.5 w-3.5" />
                  <h4 className="font-semibold text-xs">Print & Export</h4>
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1.5 text-orange-600">
                  <Users className="h-3.5 w-3.5" />
                  <h4 className="font-semibold text-xs">Multi-Class Support</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => { setActiveSection('activity'); setCurrentStep(0); }}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors duration-200 ${
              activeSection === 'activity' 
                ? 'border-b-2 border-teal-600 text-teal-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>1. Create Activity</span>
          </button>
          <button
            onClick={() => { setActiveSection('lesson'); setCurrentStep(0); }}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors duration-200 ${
              activeSection === 'lesson' 
                ? 'border-b-2 border-teal-600 text-teal-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>2. Create Lesson</span>
          </button>
          <button
            onClick={() => { setActiveSection('unit'); setCurrentStep(0); }}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors duration-200 ${
              activeSection === 'unit' 
                ? 'border-b-2 border-teal-600 text-teal-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>3. Create Unit</span>
          </button>
          <button
            onClick={() => { setActiveSection('assign'); setCurrentStep(0); }}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors duration-200 ${
              activeSection === 'assign' 
                ? 'border-b-2 border-teal-600 text-teal-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>4. Assign to Half-Term</span>
          </button>
        </div>

        {/* Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Section Title */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                {getSectionIcon(activeSection)}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {activeSection === 'activity' && 'Creating Activities'}
                {activeSection === 'lesson' && 'Building Lessons'}
                {activeSection === 'unit' && 'Managing Units'}
                {activeSection === 'assign' && 'Assigning to Half-Terms'}
              </h3>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {currentSteps[currentStep].title}
              </h4>
              <div className="prose max-w-none">
                {currentSteps[currentStep].content}
              </div>
              
              {/* Step Image (if available) */}
              {currentSteps[currentStep].image && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={currentSteps[currentStep].image} 
                    alt={currentSteps[currentStep].title}
                    className="w-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {currentSteps.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                    index === currentStep ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handlePrevious}
            className={`px-4 py-2 font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
              (currentStep > 0 || activeSection !== 'activity')
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={currentStep === 0 && activeSection === 'activity'}
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Previous</span>
          </button>
          
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {currentSteps.length}
          </div>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span>{currentStep < currentSteps.length - 1 || activeSection !== 'assign' ? 'Next' : 'Finish'}</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}