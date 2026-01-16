import { useEffect, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  ClipboardCheck,
  QrCode,
  CreditCard,
  Download,
  CheckCircle2,
  ArrowRight,
  School,
  UserPlus,
  FileText,
  Camera,
  Search,
  Settings,
  Mail,
  Building2,
  Megaphone,
} from "lucide-react";

function DocSection({
  title,
  children,
  icon: Icon
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
          {title}
        </h3>
        {children}
      </CardContent>
    </Card>
  );
}

function Step({
  number,
  title,
  children
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        <div className="text-gray-600">{children}</div>
      </div>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
      {children}
    </span>
  );
}

function PromotingYourEventSection() {
  const [selectedEmail, setSelectedEmail] = useState<"announcement" | "reminder" | "dayOf" | "dayOfCards">("announcement");

  const emails = {
    announcement: {
      subject: "College Fair Coming Up - Register with CardCapture!",
      body: `Dear Students,

We're excited to announce our upcoming College Fair on [DATE] at [LOCATION]! This is a great opportunity to meet with college representatives and learn about programs that interest you.

This year, we're using CardCapture to make connecting with colleges easier than ever. Here's what you need to do:

1. Visit cardcapture.io/register before the fair
2. Create your profile (takes about 2 minutes)
3. You'll receive a personal QR code on your phone

At the fair, simply show your QR code to any college recruiter and they'll instantly have your contact information - no forms to fill out, no waiting in line!

If you have any questions, please reach out to [COUNSELOR NAME] at [EMAIL].

See you at the fair!

[YOUR SCHOOL NAME] Counseling Office`
    },
    reminder: {
      subject: "Reminder: College Fair This Week - Get Your QR Code Ready!",
      body: `Dear Students,

Just a friendly reminder that our College Fair is coming up on [DATE]!

If you haven't already, please register at cardcapture.io/register to get your personal QR code. This will save you time at the fair and ensure colleges can follow up with you about programs you're interested in.

What to bring:
- Your phone with your CardCapture QR code ready
- Questions for the college representatives
- An open mind about your future!

Already registered? Great! Make sure you can access your QR code before the event.

We look forward to seeing you there!

[YOUR SCHOOL NAME] Counseling Office`
    },
    dayOf: {
      subject: "Today's the Day! College Fair Tips & QR Code Reminder",
      body: `Dear Students,

The College Fair is TODAY! Here are some quick tips to make the most of your experience:

Before you arrive:
- Open cardcapture.io/register and have your QR code ready
- Make a list of colleges you want to visit
- Prepare a few questions to ask recruiters

At the fair:
- Show your QR code to each college representative you meet
- Take notes about programs that interest you
- Don't be afraid to ask questions!

Can't find your QR code? No worries - just visit cardcapture.io/register on your phone to access it.

Have a great time exploring your future!

[YOUR SCHOOL NAME] Counseling Office`
    },
    dayOfCards: {
      subject: "Today's the Day! College Fair Tips",
      body: `Dear Students,

The College Fair is TODAY! Here are some quick tips to make the most of your experience:

Before you arrive:
- If you registered online, have your QR code ready at cardcapture.io/register
- Make a list of colleges you want to visit
- Prepare a few questions to ask recruiters

At the fair:
- Show your QR code to each college representative you meet
- Take notes about programs that interest you
- Don't be afraid to ask questions!

Don't have a QR code? No problem! We'll have inquiry cards available at the entrance. Just fill one out and hand it to each college recruiter you visit - they'll scan it and have your information instantly.

Have a great time exploring your future!

[YOUR SCHOOL NAME] Counseling Office`
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" />
          Promoting Your Event
        </h3>
        <p className="text-gray-600 mb-4">
          Help your students get the most out of the college fair by sending them information ahead of time.
          Here are some ready-to-use email templates you can customize and send to your students.
        </p>

        {/* Email Tabs */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex flex-wrap border-b bg-gray-50">
            <button
              onClick={() => setSelectedEmail("announcement")}
              className={`flex-1 min-w-[140px] px-3 py-3 text-sm font-medium transition-colors ${
                selectedEmail === "announcement"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600 -mb-px"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Announcement
            </button>
            <button
              onClick={() => setSelectedEmail("reminder")}
              className={`flex-1 min-w-[140px] px-3 py-3 text-sm font-medium transition-colors ${
                selectedEmail === "reminder"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600 -mb-px"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Week Before
            </button>
            <button
              onClick={() => setSelectedEmail("dayOf")}
              className={`flex-1 min-w-[140px] px-3 py-3 text-sm font-medium transition-colors ${
                selectedEmail === "dayOf"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600 -mb-px"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Day Of (QR Only)
            </button>
            <button
              onClick={() => setSelectedEmail("dayOfCards")}
              className={`flex-1 min-w-[140px] px-3 py-3 text-sm font-medium transition-colors ${
                selectedEmail === "dayOfCards"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600 -mb-px"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Day Of (w/ Cards)
            </button>
          </div>

          <div className="p-4">
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-500">Subject: </span>
              <span className="text-sm text-gray-900">{emails[selectedEmail].subject}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {emails[selectedEmail].body}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Tip: Replace the bracketed text [LIKE THIS] with your specific event details.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("coordinators");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle hash navigation
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'coordinators' || hash === 'recruiters' || hash === 'reviewers') {
      setActiveTab(hash);
    }
  }, []);

  return (
    <div className="min-h-screen bg-muted/50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            CardCapture Documentation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about using CardCapture to streamline student recruitment at college fairs.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveTab("coordinators")}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeTab === "coordinators"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Fair Coordinators</h3>
            <p className="text-sm text-gray-600">Create events & manage fairs</p>
          </button>
          <button
            onClick={() => setActiveTab("recruiters")}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeTab === "recruiters"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">University Recruiters</h3>
            <p className="text-sm text-gray-600">Sign up & capture cards</p>
          </button>
          <button
            onClick={() => setActiveTab("reviewers")}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeTab === "reviewers"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <ClipboardCheck className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">University Reviewers</h3>
            <p className="text-sm text-gray-600">Review data & export to Slate</p>
          </button>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Fair Coordinators Guide */}
          <TabsContent value="coordinators">
            <div className="space-y-6">
              <DocSection title="The Challenge Today" icon={Calendar}>
                <p className="text-gray-600 mb-4">
                  As a fair coordinator, you know the pain of trying to connect students with universities.
                  You're dealing with:
                </p>
                <ul className="space-y-2 text-gray-600 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>Getting students to sign up via QR codes (many won't or can't)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>Printing labels and ensuring student contact info is available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>Coordinating with schools to make sure students are prepared</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>Managing logistics so universities actually get student information</span>
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  <strong>CardCapture solves this.</strong> Students can register online before the fair and get a QR code,
                  OR they can fill out a traditional paper card at the event. Either way, universities scan it with their
                  phones and walk away with digital data. No more coordinating, no more logistics headaches.
                </p>
              </DocSection>

              <DocSection title="Creating Your Event" icon={FileText}>
                <Step number={1} title="Go to the Create Event Page">
                  <p>
                    Visit <a href="/create-event" className="text-blue-600 hover:underline font-medium">cardcapture.io/create-event</a> to start creating your college fair event.
                    You don't need an account to create an event.
                  </p>
                </Step>

                <Step number={2} title="Enter Event Details">
                  <p className="mb-2">Fill in the basic information about your fair:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Event Name</strong> - e.g., "Springfield High School College Fair 2026"</li>
                    <li><strong>Event Date</strong> - When the fair will take place</li>
                    <li><strong>Location</strong> - Venue name and address</li>
                    <li><strong>Start/End Time</strong> - Fair hours</li>
                    <li><strong>Contact Information</strong> - Your name, email, and phone</li>
                  </ul>
                </Step>

                <Step number={3} title="Submit Your Event">
                  <p>
                    Once submitted, your event will be added to our universal events catalog.
                    Universities browsing for fairs to attend will be able to find and sign up for your event directly.
                  </p>
                </Step>
              </DocSection>

              <DocSection title="What Happens at the Fair" icon={Users}>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Before the Fair</h4>
                    <p className="text-gray-600 mb-3">
                      When creating your event, you can choose between two registration methods - or use both!
                    </p>
                    <ul className="space-y-2 text-gray-600 mb-3">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span><strong>QR Codes:</strong> Students register online at cardcapture.io/register before the fair and receive a personal QR code on their phone.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span><strong>Paper Inquiry Cards:</strong> If you select this option when creating your event, you'll receive a box of universal inquiry cards to hand out at the event.</span>
                      </li>
                    </ul>
                    <p className="text-gray-600">
                      Either way works great - many events use both options to maximize student participation.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">During the Fair</h4>
                    <p className="text-gray-600">
                      Students visit university tables with either their QR code (from online registration) or a
                      handwritten interest card. University recruiters simply scan whichever method the student has
                      using their phone. One scan, done.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">After the Fair</h4>
                    <p className="text-gray-600">
                      Universities leave with all their data digitally captured. No physical cards for you to collect,
                      sort, or coordinate. Your job is done when the fair ends.
                    </p>
                  </div>
                </div>
              </DocSection>

              <DocSection title="Your Role is Simpler" icon={CheckCircle2}>
                <p className="text-gray-600 mb-4">
                  With CardCapture, your responsibilities are streamlined:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">You Handle</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Creating the event
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Inviting universities
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Handing out Inquiry Cards
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">CardCapture Handles</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        University registration & payment
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Card capture technology
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Data processing & export
                      </li>
                    </ul>
                  </div>
                </div>
              </DocSection>

              <DocSection title="Distributing Event Information" icon={Mail}>
                <p className="text-gray-600 mb-4">
                  Getting students prepared before the event makes everything run smoother.
                </p>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">For QR Code Events</h4>
                    </div>
                    <p className="text-gray-600">
                      Share the <Highlight>cardcapture.io/register</Highlight> link with your students before the event.
                      They'll create a profile and receive a personal QR code on their phone. This saves time at the fair
                      and ensures universities get accurate contact information.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">For Paper Card Events</h4>
                    </div>
                    <p className="text-gray-600">
                      You'll receive a box of inquiry cards before your event. Hand these out to students as they enter
                      or before the event begins. No data uploads needed - students simply fill out the card and present
                      it to university recruiters. No struggle to get students registered, no technology barriers.
                    </p>
                  </div>
                </div>
              </DocSection>

              <PromotingYourEventSection />

              <Card className="bg-blue-600 text-white">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-xl font-semibold mb-2">Ready to Create Your Event?</h3>
                  <p className="mb-4 text-blue-100">
                    It only takes a few minutes to set up your college fair.
                  </p>
                  <Button asChild variant="secondary" size="lg">
                    <a href="/create-event">
                      Create Event <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* University Recruiters Guide */}
          <TabsContent value="recruiters">
            <div className="space-y-6">
              <DocSection title="Overview" icon={School}>
                <p className="text-gray-600 mb-4">
                  CardCapture makes college fair recruiting simple. Sign up, select your event, pay, and you're ready.
                  At the fair, students arrive at your booth with either a QR code or a physical inquiry card -
                  you just scan whichever they have with your phone. That's it.
                </p>
                <p className="text-gray-600">
                  Your review team processes everything digitally back at the office and exports directly to Slate.
                </p>
              </DocSection>

              <DocSection title="Getting Started" icon={UserPlus}>
                <Step number={1} title="Create Your Account">
                  <p className="mb-2">
                    Visit <Highlight>cardcapture.io/get-started</Highlight> to sign up. You'll need:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your name and email address</li>
                    <li>Your university affiliation</li>
                  </ul>
                </Step>

                <Step number={2} title="Find or Create Your School">
                  <p className="mb-2">During signup, you'll search for your university.</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Search className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">If your school exists</p>
                        <p className="text-sm text-gray-600">
                          Select it from the search results. You can start using CardCapture immediately.
                          The school's admin will receive a notification to merge you into the main account -
                          Once merged other team members will have access to your event details and scans.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">If your school doesn't exist</p>
                        <p className="text-sm text-gray-600">
                          Create a new school profile. You'll become the admin and can invite other
                          team members from your admissions office.
                        </p>
                      </div>
                    </div>
                  </div>
                </Step>

                <Step number={3} title="Invite Your Team (Admin Only)">
                  <p>
                    If you're the school admin, go to <Highlight>Settings → User Management</Highlight> to
                    invite other recruiters and reviewers from your team. They'll receive an email invitation
                    to join your school's account.
                  </p>
                </Step>
              </DocSection>

              <DocSection title="Signing Up for Events" icon={Calendar}>
                <Step number={1} title="Browse Available Events">
                  <p>
                    From your dashboard, go to <Highlight>Events</Highlight> to see college fairs in your area.
                    You can search by date, location, or event name.
                  </p>
                </Step>

                <Step number={2} title="Claim an Event">
                  <p>
                    When you find an event you want to attend, click <Highlight>Claim Event</Highlight>.
                    This reserves a spot for your university at that fair.
                  </p>
                </Step>

                <Step number={3} title="Complete Payment">
                  <p className="mb-2">
                    After claiming, you'll be prompted to pay. Payment is handled securely through Stripe.
                  </p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="w-5 h-5" />
                    <span>Credit card, debit card, or institutional payment methods accepted</span>
                  </div>
                </Step>

                <Step number={4} title="You're Registered!">
                  <p>
                    Once payment is complete, the event appears in your dashboard. You'll have access to
                    scan cards and view captured data for this event.
                  </p>
                </Step>
              </DocSection>

              <DocSection title="At the Fair: Capturing Cards" icon={Camera}>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-amber-800 mb-2">Before You Go</h4>
                  <ul className="text-amber-700 space-y-1">
                    <li>CardCapture works in your mobile browser or you can download our app - either works</li>
                    <li>Log in to your account before arriving at the fair</li>
                    <li>Select the event you're attending</li>
                  </ul>
                </div>

                <p className="text-gray-600 mb-4">
                  Students arrive at your booth with one of two things: a <strong>QR code</strong> (if they registered online
                  beforehand) or a <strong>physical inquiry card</strong> (filled out at the event before reaching your table).
                  You simply scan whichever one they have.
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Student Has a QR Code</h4>
                    </div>
                    <p className="text-gray-600 mb-2">
                      If the student registered online, they'll show you their QR code on their phone.
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                      <li>Open the CardCapture app and tap Scan</li>
                      <li>Point your camera at the student's QR code</li>
                      <li>Done! Their info is captured instantly</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Camera className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Student Has a Paper Card</h4>
                    </div>
                    <p className="text-gray-600 mb-2">
                      If the student has a physical inquiry card:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                      <li>Open CardCapture and tap Scan</li>
                      <li>Photograph the card</li>
                      <li>Our AI extracts the information automatically</li>
                    </ol>
                  </div>
                </div>
              </DocSection>

              <DocSection title="After the Fair" icon={CheckCircle2}>
                <p className="text-gray-600 mb-4">
                  Once the fair ends, your work is done! All captured cards (both QR submissions and
                  scanned handwritten cards) are in your CardCapture account, ready for your review team.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">What Happens Next</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      Cards appear in your event dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      Reviewers can access and verify the extracted data
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      Data can be exported to Slate or downloaded as CSV
                    </li>
                  </ul>
                </div>
              </DocSection>

              <Card className="bg-blue-600 text-white">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-xl font-semibold mb-2">Ready to Get Started?</h3>
                  <p className="mb-4 text-blue-100">
                    Create your account and start capturing cards at your next college fair.
                  </p>
                  <Button asChild variant="secondary" size="lg">
                    <a href="/get-started">
                      Sign Up Now <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* University Reviewers Guide */}
          <TabsContent value="reviewers">
            <div className="space-y-6">
              <DocSection title="Overview" icon={ClipboardCheck}>
                <p className="text-gray-600 mb-4">
                  As a reviewer, your job is to verify the accuracy of captured card data before it's
                  exported to your CRM. CardCapture's AI does the heavy lifting, but you
                  ensure quality and catch any issues.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Your Key Responsibilities</h4>
                  <ul className="text-blue-700 space-y-1">
                    <li>Review AI-extracted data for accuracy</li>
                    <li>Fix any fields that were misread or incomplete</li>
                    <li>Mark cards as ready for export</li>
                    <li>Export data to Slate or download as CSV</li>
                  </ul>
                </div>
              </DocSection>

              <DocSection title="Accessing Cards for Review" icon={Search}>
                <Step number={1} title="Navigate to Your Event">
                  <p>
                    From the dashboard, click on an event to see all captured cards. Events with cards
                    needing review will show a <Highlight>Needs Review</Highlight> badge.
                  </p>
                </Step>

                <Step number={2} title="Understanding Card Statuses">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                      <span><strong>Needs Review</strong> - Waiting for verification</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                      <span><strong>Ready to Export</strong> - Verified and approved</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                      <span><strong>Exported</strong> - Already sent to Slate</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                      <span><strong>Archived</strong> - Removed from active view</span>
                    </div>
                  </div>
                </Step>

                <Step number={3} title="Filter and Sort">
                  <p>
                    Use the status badges at the top of the event page to filter cards. Click
                    <Highlight>Needs Review</Highlight> to focus on cards that need your attention.
                  </p>
                </Step>
              </DocSection>

              <DocSection title="Reviewing Card Data" icon={FileText}>
                <Step number={1} title="Open a Card">
                  <p>
                    Click on any card in the list to open the review modal. You'll see the original
                    scanned image alongside the extracted data fields.
                  </p>
                </Step>

                <Step number={2} title="Use Built-in Verification Tools">
                  <p className="mb-3">
                    CardCapture includes helpful tools to verify student information:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900 mb-1">Google Maps Address Validation</p>
                      <p className="text-sm text-gray-600">
                        Easily search for and select verified addresses. This helps ensure address data is accurate
                        and properly formatted before export.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900 mb-1">CEEB Code Lookup</p>
                      <p className="text-sm text-gray-600">
                        Search for high schools by name to find verified CEEB codes. This ensures accurate
                        high school identification for your CRM records.
                      </p>
                    </div>
                  </div>
                </Step>

                <Step number={3} title="Make Corrections">
                  <p>
                    If any field is incorrect, simply click on it and type the correct value.
                    The AI is good, but handwriting varies - you might need to fix unclear letters,
                    numbers, or abbreviations.
                  </p>
                </Step>

                <Step number={4} title="Approve the Card">
                  <p>
                    Once all fields are correct, click <Highlight>Approve</Highlight> or <Highlight>Mark Ready</Highlight>.
                    The card moves to "Ready to Export" status.
                  </p>
                </Step>
              </DocSection>

              <DocSection title="Bulk Actions" icon={Settings}>
                <p className="text-gray-600 mb-4">
                  For efficiency, you can perform actions on multiple cards at once:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Select Multiple Cards</p>
                      <p className="text-sm text-gray-600">Use the checkboxes to select multiple cards, then use bulk actions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Bulk Archive</p>
                      <p className="text-sm text-gray-600">Remove duplicate or invalid cards from the active view</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Bulk Delete</p>
                      <p className="text-sm text-gray-600">Permanently remove cards that are not needed</p>
                    </div>
                  </li>
                </ul>
              </DocSection>

              <DocSection title="Exporting to Slate" icon={Download}>
                <Step number={1} title="Navigate to Ready Cards">
                  <p>
                    Click the <Highlight>Ready to Export</Highlight> badge to see all approved cards
                    that are ready for export.
                  </p>
                </Step>

                <Step number={2} title="Select Cards to Export">
                  <p>
                    Use the checkboxes to select which cards you want to export, or use "Select All"
                    to export everything.
                  </p>
                </Step>

                <Step number={3} title="Choose Export Method">
                  <div className="space-y-3 mt-2">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Download className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Download CSV</h4>
                      </div>
                      <p className="text-gray-600">
                        Click <Highlight>Export → Download CSV</Highlight> to get a spreadsheet file
                        you can manually import into Slate or any other CRM.
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900">Direct to Slate (SFTP)</h4>
                      </div>
                      <p className="text-gray-600">
                        If your admin has configured Slate SFTP integration, click
                        <Highlight>Export → Send to Slate</Highlight> to automatically upload
                        the data to your Slate instance.
                      </p>
                    </div>
                  </div>
                </Step>

                <Step number={4} title="Confirm Export">
                  <p>
                    After exporting, cards are marked as "Exported" so you know they've been processed.
                    You can still view exported cards and re-export if needed.
                  </p>
                </Step>
              </DocSection>

              <Card className="bg-blue-600 text-white">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-xl font-semibold mb-2">Questions?</h3>
                  <p className="mb-4 text-blue-100">
                    Our support team is here to help you get the most out of CardCapture.
                  </p>
                  <Button asChild variant="secondary" size="lg">
                    <a href="/contact">
                      Contact Support <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-gray-500">
          <p>
            Need help? Contact us at{" "}
            <a href="mailto:support@cardcapture.io" className="text-blue-600 hover:underline">
              support@cardcapture.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
