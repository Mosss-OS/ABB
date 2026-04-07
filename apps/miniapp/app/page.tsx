import BountyBoard from './components/BountyBoard';
import AgentCard from './components/AgentCard';
import PostBountyForm from './components/PostBountyForm';
import ActivityFeed from './components/ActivityFeed';

export default function Home() {
  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Agent Bounty Board</h1>
      
      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-2">AGENTS</h2>
        <AgentCard />
      </section>
      
      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-2">POST A BOUNTY</h2>
        <PostBountyForm />
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-2">ACTIVITY</h2>
        <ActivityFeed />
      </section>
      
      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-2">LIVE BOARD</h2>
        <BountyBoard />
      </section>
    </main>
  );
}
