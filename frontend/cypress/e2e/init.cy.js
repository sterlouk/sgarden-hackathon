describe('login', () => {
	beforeEach(() => {
		cy.visit('/')
	})

	it('Home page', () => {
		cy.contains("WELCOME").should("be.visible")
	})
})