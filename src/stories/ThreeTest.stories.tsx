import type { Meta, StoryObj } from "@storybook/react";
import { Scene } from "../context/Scene";
import { Mesh } from "../Mesh";

const meta = {
  title: "Scene",
  component: Scene,
} satisfies Meta<typeof Scene>;
export default meta;

type Story = StoryObj<typeof Scene>;

export const Test: Story = {
  render: () => {
    return (
      <Scene>
        <Mesh />
      </Scene>
    );
  },
};
