import { App, Modal, Setting } from "obsidian";
import { getAllQuestions, getAllQuestionsByCourses, getAllQuestionsByTags } from "src/utils/questions";
import { normalizeCourse } from "src/utils/courses";
import { normalizeTag } from "src/utils/tags";
import { activateQuizView } from "src/views";

type QuizFilterMode = "tags" | "courses";

export class QuizModal extends Modal {

    tags: Set<string>
    courses: Set<string>
    activeFilterMode: QuizFilterMode = "tags";
    selectedTags: Set<string> = new Set<string>();
    selectedCourses: Set<string> = new Set<string>();

    constructor(app: App, tags: Set<string>, courses: Set<string>) {
        super(app)
        this.tags = tags;
        this.courses = courses;
    }

    onOpen() {
        this.display()
    }

    display() {
        const {contentEl} = this;
        contentEl.empty();

        contentEl.createEl("h2", {text: "Start a quiz"})
        contentEl.createEl("p", {text: "Choose tags or courses you want to quiz yourself on. Don't select anything to quiz yourself on all questions."})

        const tabContainer = contentEl.createDiv({ cls: "quiz-filter-tabs" });
        const tagsTab = tabContainer.createEl("button", { text: "Tags", cls: "quiz-filter-tab" });
        const coursesTab = tabContainer.createEl("button", { text: "Courses", cls: "quiz-filter-tab" });

        const updateTabStyles = () => {
            tagsTab.toggleClass("is-active", this.activeFilterMode === "tags");
            coursesTab.toggleClass("is-active", this.activeFilterMode === "courses");
        };

        tagsTab.addEventListener("click", () => {
            this.activeFilterMode = "tags";
            this.display();
        });

        coursesTab.addEventListener("click", () => {
            this.activeFilterMode = "courses";
            this.display();
        });

        updateTabStyles();

        const checkboxContainer = contentEl.createDiv({ 
            cls: 'tag-checkbox-container',
         });

        const activeOptions = this.activeFilterMode === "tags"
            ? Array.from(this.tags, (tag) => normalizeTag(tag))
            : Array.from(this.courses, (course) => normalizeCourse(course));
        const selectedOptions = this.activeFilterMode === "tags" ? this.selectedTags : this.selectedCourses;

        activeOptions.sort((a, b) => a.localeCompare(b));

        activeOptions.forEach((option) => {
            new Setting(checkboxContainer)
                .setName(option)
                .addToggle(toggle => toggle
                    .setValue(selectedOptions.has(option))
                    .onChange(value => {
                        if (value) {
                            selectedOptions.add(option);
                        } else {
                            selectedOptions.delete(option);
                        }
                    })
                );
        });

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText('Cancel')
                .onClick(() => this.close())
            );

        new Setting(buttonContainer)
            .addButton(button => button
                .setButtonText('Create')
                .onClick(() => {
                    if (this.activeFilterMode === "tags" && this.selectedTags.size > 0) {
                        const tags = this.selectedTags
                        getAllQuestionsByTags(tags)
                        .then(questionsByTags => {
                            activateQuizView(true, questionsByTags, tags);
                        })
                    } else if (this.activeFilterMode === "courses" && this.selectedCourses.size > 0) {
                        const courses = this.selectedCourses
                        getAllQuestionsByCourses(courses)
                        .then(questionsByCourses => {
                            activateQuizView(true, questionsByCourses, courses);
                        })
                    } else {
                        getAllQuestions()
                        .then(questions => {
                            activateQuizView(true, questions);
                        })
                    }
                    this.close();
                })
            );

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
