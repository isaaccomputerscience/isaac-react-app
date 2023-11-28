import React, { useEffect, useState } from "react";
import { useExpandContent } from "../markup/portals/Tables";
import { useStatefulElementRef } from "../markup/portals/utils";
import { Button, Card, CardBody, Row } from "reactstrap";
import classnames from "classnames";
import { IsaacContent } from "../../content/IsaacContent";

const goToQuestionFinder = (
  <>
    <h2>All done! Want more questions?</h2>
    <Row className="w-75 mx-auto mt-5 mb-3">
      <Button href="/gameboards/new" className="btn-block btn-lg btn-primary">
        Go to Question Finder
      </Button>
    </Row>
  </>
);

const QuestionCard = ({ setExpanded }: { setExpanded: (expanded: boolean) => void }) => {
  const [expandRef, updateExpandRef] = useStatefulElementRef<HTMLDivElement>();
  const { expandButton, outerClasses, expanded } = useExpandContent(true, expandRef);
  const [question, setQuestion] = useState<number>(0);
  const isMoreQuestions = question < 5;
  const [questionData, setQuestionData] = useState<any[]>([
    {
      id: "prog_func_06",
      title: "Higher-order functions",
      type: "isaacQuestionPage",
      encoding: "markdown",
      canonicalSourceFile:
        "content/computer_science/programming_paradigms/functional_programming/questions/prog_func_06.json",
      children: [
        {
          id: "prog_func_06|051e6cad-04f7-46dc-ba36-db81416f02f1",
          type: "isaacMultiChoiceQuestion",
          encoding: "markdown",
          children: [],
          value:
            "One of the features of functional programming languages is higher-order functions. Which of the following is the correct definition of a higher-order function?",
          published: true,
          hints: [
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Key Terms\n\n[glossary:glossary-page-f|functional-programming]\n\n* [The role of higher-order functions and how they work](/concepts/prog_func_higher_order)\n\n",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Goal and information given\n\nIdentify which of the statements given provides a correct definition of a higher-order function. \n\n* **One** statement provides a correct definition",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
            {
              type: "content",
              children: [
                {
                  id: "prog_func_06|051e6cad-04f7-46dc-ba36-db81416f02f1|prog_func_06|051e6cad-04f7-46dc-ba36-db81416f02f1|aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1tZVpGNEhfTWFKWQ==",
                  type: "video",
                  encoding: "markdown",
                  children: [],
                  value: "_Add video caption here_",
                  published: true,
                  src: "https://www.youtube.com/watch?v=meZF4H_MaJY",
                },
              ],
              published: false,
              tags: [],
            },
          ],
          choices: [
            {
              type: "choice",
              encoding: "markdown",
              children: [],
              value: "A function that can be passed to another function as an argument or returned as a result ",
              published: false,
            },
            {
              type: "choice",
              encoding: "markdown",
              children: [],
              value: "A function that is more important than all other functions",
              published: false,
            },
            {
              type: "choice",
              encoding: "markdown",
              children: [],
              value: "A function that takes a function as an argument or returns a function as a result, or does both ",
              published: false,
            },
            {
              type: "choice",
              encoding: "markdown",
              children: [],
              value:
                "A function that is returned when applying another function with fewer arguments than in the function definition",
              published: false,
            },
          ],
        },
      ],
      relatedContent: [
        {
          id: "prog_func_higher_order",
          title: "Higher-order functions",
          type: "isaacConceptPage",
          tags: ["functional_programming", "computer_science", "programming_paradigms"],
          correct: false,
          audience: [
            {
              stage: ["a_level"],
              examBoard: ["aqa"],
            },
          ],
        },
      ],
      published: true,
      tags: ["functional_programming", "computer_science", "programming_paradigms"],
      level: 3,
      audience: [
        {
          stage: ["a_level"],
          examBoard: ["aqa"],
          difficulty: ["practice_2"],
        },
      ],
    },
    {
      id: "data_rep_06",
      title: "What it takes to save",
      type: "isaacQuestionPage",
      encoding: "markdown",
      canonicalSourceFile:
        "content/computer_science/data_and_information/image_representation/questions/data_rep_06.json",
      children: [
        {
          id: "data_rep_06|d5b9e7da-2f35-4c6f-afe3-398d4a8bd893",
          type: "isaacNumericQuestion",
          encoding: "markdown",
          children: [
            {
              type: "content",
              encoding: "markdown",
              children: [],
              value:
                "The image shown below has dimensions of 16&times;16 pixels, and four different colours, and it is represented as a bitmap. What is the number of bytes required to represent all the pixels in the image?",
              published: false,
              tags: [],
            },
            {
              id: "data_rep_06|d5b9e7da-2f35-4c6f-afe3-398d4a8bd893|data_rep_06|d5b9e7da-2f35-4c6f-afe3-398d4a8bd893|Y29udGVudC9jb21wdXRlcl9zY2llbmNlL2RhdGFfYW5kX2luZm9ybWF0aW9uL2ltYWdlX3JlcHJlc2VudGF0aW9uL3F1ZXN0aW9ucy9maWd1cmVzL2lzYWFjX2NzX2RhdGFfaW1hZ2VfcV9iaXRtYXBfbW91c2Uuc3Zn",
              type: "figure",
              encoding: "markdown",
              children: [],
              value: "A 16 &times; 16 bitmapped graphic with four colours (pink, orange, blue, and white)",
              published: true,
              src: "content/computer_science/data_and_information/image_representation/questions/figures/isaac_cs_data_image_q_bitmap_mouse.svg",
              altText:
                "An image made up of a grid of 16 by 16 pixels, each of which can be one of four colours (pink, orange, blue, or white).",
            },
          ],
          published: true,
          hints: [
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Key Terms\n\n[glossary:glossary-page-b|bitmapped-graphic]\n\n\n[glossary:glossary-page-p|pixel]\n\n\n#### Knowledge assumed\n\n* [Bitmapped graphics](/concepts/data_rep_bitmap)",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Goal and information given\n\nThe bitmapped graphic has four colours. Calculate the number of bytes required to represent all the pixels in the image. \n\n* The image dimensions are 16 &times; 16.\n* The image has four colours.\n* Each pixel has one colour.\n* The answer should be given in bytes.\n\n",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
            {
              type: "content",
              children: [
                {
                  id: "data_rep_06|d5b9e7da-2f35-4c6f-afe3-398d4a8bd893|data_rep_06|d5b9e7da-2f35-4c6f-afe3-398d4a8bd893|aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1vc29ibVNSOFlPYw==",
                  type: "video",
                  encoding: "markdown",
                  children: [],
                  value: "_Add video caption here_",
                  published: true,
                  src: "https://www.youtube.com/watch?v=osobmSR8YOc",
                },
              ],
              published: false,
              tags: [],
            },
          ],
          requireUnits: false,
          disregardSignificantFigures: false,
          availableUnits: [],
        },
      ],
      relatedContent: [
        {
          id: "data_rep_bitmap",
          title: "Bitmapped graphics",
          type: "isaacConceptPage",
          tags: ["computer_science", "image_representation", "data_and_information"],
          correct: false,
          audience: [
            {
              stage: ["a_level"],
              examBoard: ["aqa", "cie"],
            },
            {
              stage: ["gcse"],
              examBoard: ["aqa", "edexcel", "eduqas", "ocr", "wjec"],
            },
          ],
        },
      ],
      published: true,
      tags: ["computer_science", "image_representation", "data_and_information"],
      level: 2,
      audience: [
        {
          stage: ["a_level"],
          examBoard: ["aqa", "cie"],
          difficulty: ["challenge_1"],
        },
      ],
    },
    {
      id: "net_comm_01",
      title: "Serial or parallel?",
      type: "isaacQuestionPage",
      encoding: "markdown",
      canonicalSourceFile: "content/computer_science/computer_networks/communication/questions/net_comm_01.json",
      children: [
        {
          id: "net_comm_01|3a6b84f6-2790-47fe-9b7a-6ca113bae842",
          type: "isaacParsonsQuestion",
          encoding: "markdown",
          children: [],
          value:
            "Put the statements in the correct order to create a paragraph about the differences between serial and parallel transmission.",
          published: true,
          hints: [
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Key Terms\n\n[glossary:glossary-page-d|data-communication]\n\n#### Knowledge assumed\n* [Serial and parallel transmission](/concepts/net_comm_types#serial-parallel)",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Goal and information given\n\nPut the statements in the correct order to form a grammatically correct paragraph about the differences between serial and parallel transmission.\n\n* Seven statements with clear punctuation\n* The paragraph is about the differences between serial and parallel transmission\n\n",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
          ],
          items: [
            {
              id: "a5c6",
              type: "parsonsItem",
              children: [],
              value: "This means that one bit is sent at a time. ",
              indentation: 0,
            },
            {
              id: "9ee7",
              type: "parsonsItem",
              children: [],
              value: "through multiple wires.",
              indentation: 0,
            },
            {
              id: "dae7",
              type: "parsonsItem",
              children: [],
              value: "On the other hand, in parallel transmission, ",
              indentation: 0,
            },
            {
              id: "49a8",
              type: "parsonsItem",
              children: [],
              value: "through a single wire.",
              indentation: 0,
            },
            {
              id: "8f4c",
              type: "parsonsItem",
              children: [],
              value: "In serial data transmission,  ",
              indentation: 0,
            },
            {
              id: "6358",
              type: "parsonsItem",
              children: [],
              value: "multiple bits are sent at the same time ",
              indentation: 0,
            },
            {
              id: "249f",
              type: "parsonsItem",
              children: [],
              value: "bits are transmitted one after the other",
              indentation: 0,
            },
          ],
        },
      ],
      relatedContent: [
        {
          id: "net_comm_types",
          title: "Types of communication",
          type: "isaacConceptPage",
          tags: ["computer_science", "computer_networks", "communication"],
          correct: false,
          audience: [
            {
              stage: ["a_level"],
              examBoard: ["aqa", "eduqas", "wjec"],
            },
          ],
        },
      ],
      published: true,
      tags: ["computer_science", "computer_networks", "communication"],
      level: 2,
      audience: [
        {
          stage: ["a_level"],
          examBoard: ["aqa", "wjec", "eduqas"],
          difficulty: ["challenge_1"],
        },
      ],
    },
    {
      id: "net_network_10_v3",
      title: "Collisions",
      type: "isaacQuestionPage",
      encoding: "markdown",
      canonicalSourceFile: "content/computer_science/computer_networks/networking/questions/net_network_10_v3.json",
      children: [
        {
          id: "net_network_10_v3|90f4ecf9-277d-4f0f-8cfd-f4c554cfa74b",
          type: "isaacClozeQuestion",
          encoding: "markdown",
          children: [],
          value:
            "Transmission across shared network media has to contend with [drop-zone]. This is where multiple signals are sent on the network at the same [drop-zone]. This is unavoidable on any network of more than a couple of computers.\n\nIf there is a collision the signals cannot reach their destination. Devices that are trying to send must stop and wait for a [drop-zone] amount of time before trying again. ",
          published: true,
          hints: [
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Key terms\n\n[glossary:glossary-page-c|collision-networking]\n\n#### Knowledge assumed\n\n* [Read about network collisions](/concepts/net_network_protocols#ethernet)",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Goal and information given\n\nComplete the text by dragging and dropping the most suitable word into the relevant position.\n\n* You have been given a piece of text with three missing words",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
            {
              type: "content",
              children: [
                {
                  id: "net_network_10_v3|90f4ecf9-277d-4f0f-8cfd-f4c554cfa74b|net_network_10_v3|90f4ecf9-277d-4f0f-8cfd-f4c554cfa74b|aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1fb0RqQk9VanlYOA==",
                  type: "video",
                  encoding: "markdown",
                  children: [],
                  value: "_Add video caption here_",
                  published: true,
                  src: "https://www.youtube.com/watch?v=_oDjBOUjyX8",
                },
              ],
              published: false,
              tags: [],
            },
          ],
          items: [
            {
              id: "ec44",
              type: "item",
              children: [],
              value: "collisions",
            },
            {
              id: "6056",
              type: "item",
              children: [],
              value: "time",
            },
            {
              id: "395f",
              type: "item",
              children: [],
              value: "random",
            },
          ],
        },
      ],
      relatedContent: [
        {
          id: "net_network_protocols",
          title: "Network standards and protocols",
          type: "isaacConceptPage",
          tags: ["computer_science", "computer_networks", "networking"],
          correct: false,
          audience: [
            {
              stage: ["a_level"],
              examBoard: ["cie", "eduqas", "wjec", "ocr"],
            },
            {
              stage: ["gcse"],
              examBoard: ["aqa", "edexcel", "eduqas", "ocr", "wjec"],
            },
          ],
        },
      ],
      published: true,
      tags: ["computer_science", "computer_networks", "networking"],
      level: 0,
      audience: [
        {
          stage: ["a_level"],
          examBoard: ["aqa", "cie", "eduqas", "ocr", "wjec"],
          difficulty: ["practice_1"],
        },
      ],
    },
    {
      id: "sys_proglang_g02",
      title: "High- or low-level?",
      type: "isaacQuestionPage",
      encoding: "markdown",
      canonicalSourceFile:
        "content/computer_science/computer_systems/programming_languages/questions/sys_proglang_g02.json",
      children: [
        {
          id: "sys_proglang_g02|bfb0c25c-c454-45b4-94fd-2b21ce6eb6c2",
          type: "isaacClozeQuestion",
          encoding: "markdown",
          children: [
            {
              type: "content",
              encoding: "markdown",
              children: [],
              value:
                "Label the statements below showing the characteristics of low- and high-level programming languages by dragging the correct label into the last column.",
              published: false,
              tags: [],
            },
            {
              type: "content",
              encoding: "markdown",
              children: [],
              value:
                '<table>\n\t<tr>\n    \t<th class="hi-navy-50">Characteristic</th>\n        <th class="hi-navy-50">Label</th>\n    </tr>\n    <tr>\n    \t<td>Use syntax similar to human language</td>\n        <td>[drop-zone]</td>\n    </tr>\n    <tr>\n    \t<td>Require specific knowledge of a processor and its operations</td>\n        <td>[drop-zone]</td>\n    </tr>\n    <tr>\n    \t<td>Must be compiled and converted into machine code before they are run</td>\n        <td>[drop-zone]</td>\n    </tr>\n    <tr>\n    \t<td>Typically used to control specific hardware</td>\n        <td>[drop-zone]</td>\n    </tr>\n    <tr>\n    \t<td>Have built-in libraries that the programmer can call upon</td>\n        <td>[drop-zone]</td>\n    </tr>\n    <tr>\n    \t<td>Are easier to learn and understand</td>\n        <td>[drop-zone]</td>\n    </tr>\n    <tr>\n    \t<td>Sometime use a set of mnemonics for key commands</td>\n        <td>[drop-zone]</td>\n    </tr>\n</table>',
              published: false,
              tags: [],
            },
          ],
          published: true,
          hints: [
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Key terms\n\n[glossary:glossary-page-h|high-level-languages]\n\n[glossary:glossary-page-l|low-level-languages]\n\n#### Knowledge assumed\n\n[High-level language characteristics](/concepts/sys_proglang_high_level)\n\n[Low-level language characteristics](/concepts/sys_proglang_low_level)",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
            {
              type: "content",
              children: [
                {
                  type: "content",
                  encoding: "markdown",
                  children: [],
                  value:
                    "#### Goal \n\nYou have been provided with some characteristics of programming languages. Label the statements according to whether they are characteristics of high-level or low-level languages.  \n\n#### Think about this\n\nWhilst reviewing the characteristics, have an example of a high-level and low-level language in mind. If you can't think of some use the following: \n\nPython - High-level   \nAssembly language - Low-level   \n\nFor each of the statements see which of these examples they apply to. ",
                  published: false,
                  tags: [],
                },
              ],
              published: false,
              tags: [],
            },
          ],
          items: [
            {
              id: "1032",
              type: "item",
              children: [],
              value: "High</br>level",
            },
            {
              id: "15c4",
              type: "item",
              children: [],
              value: "Low</br>level",
            },
          ],
          withReplacement: true,
        },
      ],
      relatedContent: [
        {
          id: "sys_proglang_high_level",
          title: "High-level languages",
          type: "isaacConceptPage",
          tags: ["computer_systems", "computer_science", "programming_languages"],
          correct: false,
          audience: [
            {
              stage: ["a_level"],
              examBoard: ["aqa", "cie", "eduqas", "ocr", "wjec"],
            },
            {
              stage: ["gcse"],
              examBoard: ["aqa", "edexcel", "eduqas", "ocr", "wjec"],
            },
          ],
        },
      ],
      published: true,
      tags: ["computer_systems", "computer_science", "programming_languages"],
      level: 0,
      audience: [
        {
          stage: ["gcse"],
          examBoard: ["aqa", "edexcel", "eduqas", "ocr", "wjec"],
          difficulty: ["challenge_1"],
        },
      ],
    },
  ]);

  useEffect(() => {
    setExpanded(expanded);
  }, [expanded, setExpanded]);

  return (
    <div className={!expanded ? "question-tile" : ""}>
      <Row className="m-0 d-flex justify-content-between">
        <h3 className="font-weight-normal m-0 align-self-baseline">Quick question!</h3>
        {isMoreQuestions && (
          <Button className="next-question bg-transparent border-0 btn-link" onClick={() => setQuestion(question + 1)}>
            Next question
          </Button>
        )}
      </Row>
      <Card
        ref={updateExpandRef}
        className={classnames(outerClasses, expanded ? "random-question-panel" : "mt-2 pb-2")}
        style={expanded ? { maxHeight: "560px" } : { maxHeight: "450px" }}
      >
        <CardBody className="p-3">
          <div
            style={expanded ? { maxHeight: "500px" } : { maxHeight: "400px" }}
            className="overflow-auto hidden-scrollbar"
          >
            {isMoreQuestions ? <IsaacContent doc={questionData[question]} /> : goToQuestionFinder}
          </div>
          {expanded ? expandButton : isMoreQuestions && expandButton}
        </CardBody>
      </Card>
    </div>
  );
};

export default QuestionCard;
